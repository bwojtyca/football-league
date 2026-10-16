/**
 * Short names for tight places (the live game row, pairs, the game's boards), evaluation 4:
 * the first name when no one else among `names` has it, else the first name and the initial of
 * the last word ("Ala N."), else the whole name.
 */
export function shortNames(names: ReadonlyMap<string, string>): Map<string, string> {
  const first = (name: string) => name.trim().split(/[\s-]+/)[0] ?? name;
  const initial = (name: string) => {
    const words = name.trim().split(/\s+/);
    return words.length > 1 ? `${first(name)} ${words[words.length - 1][0]}.` : name;
  };
  const count = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) {
      const key = value.toLocaleLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return (value: string) => counts.get(value.toLocaleLowerCase()) ?? 0;
  };
  const all = [...names.values()];
  const firsts = count(all.map(first));
  const initials = count(all.map(initial));
  const result = new Map<string, string>();
  for (const [id, name] of names) {
    result.set(
      id,
      firsts(first(name)) === 1
        ? first(name)
        : initials(initial(name)) === 1
          ? initial(name)
          : name,
    );
  }
  return result;
}
