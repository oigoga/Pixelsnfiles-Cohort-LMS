// Shuffle array in place (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Chunk students into groups of 3-4, no group fewer than 3
export function assignGroups(students) {
  const shuffled = shuffle([...students])
  const groups = []
  let i = 0

  while (i < shuffled.length) {
    const remaining = shuffled.length - i
    // If remainder would leave a group of 1 or 2, expand current group to 4
    const size = remaining % 3 === 1 && remaining > 4 ? 4
               : remaining % 3 === 2 && remaining > 5 ? 4
               : 3
    groups.push(shuffled.slice(i, i + Math.min(size, remaining)))
    i += size
  }

  return groups
}
