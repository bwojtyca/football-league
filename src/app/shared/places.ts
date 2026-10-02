/**
 * Places in a table sorted best first, shared on a tie: rows that `tied` calls equal take
 * the place of the first of them and the next row skips the shared places ("1, 1, 3").
 */
export function places<T>(rows: readonly T[], tied: (a: T, b: T) => boolean): number[] {
  const result: number[] = [];
  rows.forEach((row, index) =>
    result.push(index > 0 && tied(rows[index - 1], row) ? result[index - 1] : index + 1),
  );
  return result;
}
