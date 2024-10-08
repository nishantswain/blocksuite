import { assertEquals } from '@blocksuite/global/utils';

import type { SelectTag } from '../utils/tags/multi-tag-select.js';
import type { Column } from '../view-manager/column.js';
import type { GroupData } from './group-by/helper.js';

/**
 * Class for computing statistics on a DataViewColumnManager column.
 * Supports various statistical operations such as counting, sum, mean, median, mode, max, min, range,
 * and specific operations for checkbox columns.
 */
export class ColumnDataStats<Col extends Column = Column> {
  private dataViewManager: Col['view'];

  /**
   * Constructs a new ColumnDataStats instance.
   *
   * @param column The column for which statistics are computed.
   */
  constructor(private column: Col) {
    this.dataViewManager = column.view;
  }

  private _assertColumnType(type: string) {
    assertEquals(
      this.column.type$.value,
      type,
      `This function should only be called in a column of type ${type}`
    );
  }

  // this functions also splits the individual values inside the multiselect
  private _getAllValuesAsString(group?: GroupData) {
    const colType = this.column.type$.value;
    const colValues: string[] = [];

    for (const rId of group?.rows ?? this.dataViewManager.rows$.value) {
      switch (colType) {
        case 'multi-select': {
          const options = (this.column.data$.value.options ??
            []) as SelectTag[];
          const values = (this.column.getValue(rId) ?? []) as string[];
          const map = new Map<string, SelectTag>(options?.map(v => [v.id, v]));
          for (const id of values) {
            const opt = map.get(id);

            if (opt) colValues.push(opt.value);
          }
          break;
        }
        default: {
          const value = this.column.getStringValue(rId);
          if (value.trim() !== '') colValues.push(value);
        }
      }
    }

    return colValues;
  }

  private _getCheckBoxColValues(group?: GroupData) {
    this._assertColumnType('checkbox');
    const val = (group?.rows ?? this.dataViewManager.rows$.value).map(rId => {
      return this.column.getValue(rId);
    });
    return val as (boolean | undefined)[];
  }

  // gets the count of non-empty values in the column with separated out multiselect items
  private _getColumnValueCounts(group?: GroupData) {
    return this._getAllValuesAsString(group).length;
  }

  private _getColValuesAsNumber(group?: GroupData) {
    this._assertColumnType('number');
    const values: number[] = [];
    for (const rId of group?.rows ?? this.dataViewManager.rows$.value) {
      const value = this.column.getValue(rId) as number | undefined;
      if (value !== undefined) values.push(value);
    }
    return values;
  }

  // @ts-ignore
  private _getColValuesAsString(group?: GroupData, noEmpty: boolean = false) {
    const val = (group?.rows ?? this.dataViewManager.rows$.value).map(rId => {
      return this.column.getStringValue(rId);
    });
    return noEmpty ? val.filter(v => v.trim() !== '') : val;
  }

  private _getEmptyCellCount(group?: GroupData) {
    let empty = 0;
    const rows = group?.rows ?? this.dataViewManager.rows$.value;
    for (const rId of rows) {
      const colVal = this.column.getStringValue(rId).trim();
      if (colVal === '') empty++;
    }
    return empty;
  }

  private _getNonEmptyCellCount(group?: GroupData) {
    let notEmpty = 0;

    const rows = group?.rows ?? this.dataViewManager.rows$.value;
    for (const rId of rows) {
      const colVal = this.column.getStringValue(rId).trim();
      if (colVal !== '') notEmpty++;
    }
    return notEmpty;
  }

  /**
   * Returns the number of checked checkboxes.
   */
  checked(group?: GroupData) {
    let checked = 0;
    const values = this._getCheckBoxColValues(group);
    for (const value of values) {
      if (value) checked++;
    }
    return checked;
  }

  /**
   * Returns the number of cells in the column.
   */
  countAll(group?: GroupData) {
    return group?.rows.length ?? this.dataViewManager.rows$.value.length;
  }

  /**
   * Returns the number of cells in the column which are *empty*.
   */
  countEmpty(group?: GroupData) {
    return this._getEmptyCellCount(group);
  }

  /**
   * Returns the number of cells in the column which are *not empty*.
   */
  countNonEmpty(group?: GroupData) {
    return this._getNonEmptyCellCount(group);
  }

  /**
   * Returns the number of unique values in the column.
   */
  countUniqueValues(group?: GroupData) {
    return [...new Set(this._getAllValuesAsString(group))].length;
  }

  /**
   * Returns the number of cells in the column with a value in it.
   */
  countValues(group?: GroupData) {
    return this._getColumnValueCounts(group);
  }

  /**
   * Returns the maximum value in the column.
   */
  max(group?: GroupData) {
    const values = this._getColValuesAsNumber(group);

    return Math.max(...values);
  }

  // Math Ops

  /**
   * Returns the average of values in the column.
   */
  mean(group?: GroupData) {
    const values = this._getColValuesAsNumber(group);
    let sum = 0;
    for (const val of values) sum += val;
    return sum / values.length;
  }

  /**
   * Returns the median of the column.
   */
  median(group?: GroupData) {
    const values = this._getColValuesAsNumber(group).sort((a, b) => a - b);
    const n = values.length;
    const mid = Math.floor(n / 2);

    if (n % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    } else {
      return values[mid];
    }
  }

  /**
   * Returns the minimum value in the column.
   */
  min(group?: GroupData) {
    const values = this._getColValuesAsNumber(group);

    return Math.min(...values);
  }

  /**
   * Returns the mode of the column.
   */
  mode(group?: GroupData) {
    const values = this._getColValuesAsNumber(group);

    const frequencyMap = new Map<number, number>();

    values.forEach(value => {
      const cur = frequencyMap.get(value);
      cur === undefined
        ? frequencyMap.set(value, 1)
        : frequencyMap.set(value, cur + 1);
    });

    let mode = 0;
    let maxFrequency = 0;

    frequencyMap.forEach((frequency, element) => {
      if (frequency > maxFrequency) {
        mode = element;
        maxFrequency = frequency;
      }
    });

    return mode;
  }

  /**
   * Returns the number of unchecked checkboxes.
   */
  notChecked(group?: GroupData) {
    let notChecked = 0;
    const values = this._getCheckBoxColValues(group);
    for (const value of values) {
      if (!value) notChecked++;
    }
    return notChecked;
  }

  /**
   * Returns the percent of checked checkboxes.
   */
  percentChecked(group?: GroupData) {
    this._assertColumnType('checkbox');
    return this.checked(group) / this.countAll(group);
  }

  /**
   * Returns the percent of cells in the column which are empty.
   */
  percentEmpty(group?: GroupData) {
    return this._getEmptyCellCount(group) / this.countAll(group);
  }

  // Checkbox

  /**
   * Returns the percent of cells in the column which are not empty.
   */
  percentNonEmpty(group?: GroupData) {
    return 1.0 - this.percentEmpty(group);
  }

  /**
   * Returns the percent of unchecked checkboxes.
   */
  percentNotChecked(group?: GroupData) {
    this._assertColumnType('checkbox');
    return 1.0 - this.percentChecked(group);
  }

  /**
   * Returns the range of the value in the column (max - min).
   */
  range(group?: GroupData) {
    return this.max(group) - this.min(group);
  }

  /**
   * Returns the sum of all values in the column.
   */
  sum(group?: GroupData) {
    const values = this._getColValuesAsNumber(group);
    let sum = 0;
    for (const val of values) sum += val;
    return sum;
  }
}
