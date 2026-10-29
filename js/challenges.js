// HackerRank-style coding challenges and the multiple-choice quiz for the Assess tab.
// Each challenge's tests run against your code in the browser; the first `samples`
// tests are shown, the rest are hidden like on a real assessment. A test can be
// { args, out } or { make: () => ({ args, out }) } for large generated inputs.
// A challenge can set `starter` ({ py, js }) to hand out helper code, like a tree builder.

// Level-order list (LeetCode style, null = missing child) of a balanced BST holding lo..hi
function bstLevelOrder(lo, hi) {
  const out = [];
  const ranges = [[lo, hi]];
  for (let head = 0; head < ranges.length; head++) {
    const [a, b] = ranges[head];
    if (a > b) { out.push(null); continue; }
    const mid = Math.floor((a + b) / 2);
    out.push(mid);
    ranges.push([a, mid - 1], [mid + 1, b]);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

const TREE_PY = `class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def build(values):
    # Level-order list -> tree. None means "no node here".
    if not values or values[0] is None:
        return None
    root = Node(values[0])
    queue = [root]
    i = 1
    for node in queue:
        if i >= len(values):
            break
        if values[i] is not None:
            node.left = Node(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = Node(values[i])
            queue.append(node.right)
        i += 1
    return root
`;

const TREE_JS = `class Node {
  constructor(val) { this.val = val; this.left = null; this.right = null; }
}

// Level-order list -> tree. null means "no node here".
function build(values) {
  if (!values.length || values[0] === null) return null;
  const root = new Node(values[0]);
  const queue = [root];
  let i = 1;
  for (let head = 0; head < queue.length && i < values.length; head++) {
    const node = queue[head];
    if (values[i] !== null) queue.push(node.left = new Node(values[i]));
    i++;
    if (i < values.length && values[i] !== null) queue.push(node.right = new Node(values[i]));
    i++;
  }
  return root;
}
`;

PREP.challenges = [
  {
    id: 'brackets', title: 'Config Brackets', diff: 'E', time: 15, tags: ['Stack', 'Strings'],
    fn: 'isBalanced',
    params: [['string', 's', 'the template text']],
    returns: ['boolean', 'true if every bracket is closed in the right order'],
    story: '<p>A config validator checks templates before they ship. Every opening bracket <code>(</code>, <code>[</code> or <code>{</code> must be closed by the matching bracket, in the right order. Other characters (letters, digits, spaces) can appear and should be ignored.</p><p>Return whether the brackets in <code>s</code> are balanced.</p>',
    constraints: ['0 ≤ length of s ≤ 10⁵'],
    samples: 2,
    tests: [
      { args: ['{[()]}'], out: true, why: 'Each bracket closes the most recent one still open.' },
      { args: ['{[(])}'], out: false, why: '<code>]</code> arrives while <code>(</code> is still open.' },
      { args: [''], out: true },
      { args: ['(('], out: false },
      { args: ['))(('], out: false },
      { args: ['config{ items[ (a) ] }'], out: true },
      { args: [']'], out: false },
      { args: ['([]{})[]'], out: true },
      { make: () => ({ args: ['('.repeat(50000) + ')'.repeat(50000)], out: true }) },
      { make: () => ({ args: ['[]'.repeat(40000) + '('], out: false }) },
    ],
    hint: 'The most recently opened bracket is the one that has to close next. Which data structure gives you "most recent first"?',
    approach: 'Push every opening bracket onto a stack. On a closing bracket, the top of the stack must be its partner; pop it, or fail if the stack is empty or the top doesn\'t match. At the end the stack must be empty.',
    complexity: 'O(n) time, O(n) space for the stack.',
    solution: {
      py: `def isBalanced(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack`,
      js: `function isBalanced(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (ch in pairs && stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}`,
    },
  },

  {
    id: 'compress', title: 'Log Compression', diff: 'E', time: 15, tags: ['Strings', 'Two pointers'],
    fn: 'compress',
    params: [['string', 's', 'the text to compress']],
    returns: ['string', 'the compressed text'],
    story: '<p>To save disk space, a logging agent run-length encodes text: each run of the same character becomes the character followed by how many times it repeats. A run of length 1 is written as just the character.</p><p>Return the compressed form of <code>s</code>. Upper and lower case letters are different characters.</p>',
    constraints: ['0 ≤ length of s ≤ 10⁵', 's contains only letters'],
    samples: 2,
    tests: [
      { args: ['aaabccdddd'], out: 'a3bc2d4', why: '"aaa" → a3, "b" → b, "cc" → c2, "dddd" → d4.' },
      { args: ['abc'], out: 'abc', why: 'Every run has length 1, so nothing changes.' },
      { args: [''], out: '' },
      { args: ['zzzzzzzzzzzz'], out: 'z12' },
      { args: ['aabbaa'], out: 'a2b2a2' },
      { args: ['a'], out: 'a' },
      { args: ['AAaa'], out: 'A2a2' },
      { make: () => ({ args: ['x'.repeat(100000)], out: 'x100000' }) },
    ],
    hint: 'Walk through the string once, keeping track of where the current run started.',
    approach: 'Scan with two indexes: i marks the start of a run and j moves forward while the character stays the same. Append the character plus j − i if the run is longer than 1, then jump i to j. Build the output in a list and join once, since repeated string concatenation can be slow.',
    complexity: 'O(n) time, O(n) space for the output.',
    solution: {
      py: `def compress(s):
    out = []
    i = 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        run = j - i
        out.append(s[i] + (str(run) if run > 1 else ''))
        i = j
    return ''.join(out)`,
      js: `function compress(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    const run = j - i;
    out.push(s[i] + (run > 1 ? run : ''));
    i = j;
  }
  return out.join('');
}`,
    },
  },

  {
    id: 'ipv4', title: 'Firewall Rule Checker', diff: 'E', time: 15, tags: ['Strings', 'Networking'],
    fn: 'validateAddresses',
    params: [['string[]', 'addresses', 'the addresses to check']],
    returns: ['boolean[]', 'for each address, whether it is a valid IPv4 address'],
    story: '<p>Before a firewall rule is saved, every source address is validated. A valid IPv4 address is exactly four decimal numbers separated by dots, where:</p><ul><li>each number is between 0 and 255,</li><li>a number has no leading zeros (<code>0</code> is fine, <code>01</code> is not),</li><li>there are no other characters, including spaces and signs.</li></ul><p>Return a list with one boolean per address.</p>',
    constraints: ['1 ≤ number of addresses ≤ 10⁴', 'each address has at most 30 characters'],
    samples: 2,
    tests: [
      { args: [['192.168.1.10', '256.1.1.1', '10.0.0.01', '1.2.3']], out: [true, false, false, false], why: '256 is too big, 01 has a leading zero, and 1.2.3 has only three parts.' },
      { args: [['0.0.0.0', '255.255.255.255']], out: [true, true], why: 'The smallest and largest valid addresses.' },
      { args: [['1.2.3.4.5', 'a.b.c.d', '1..2.3', '']], out: [false, false, false, false] },
      { args: [['172.16.254.1', ' 1.2.3.4', '1.2.3.4 ', '01.2.3.4']], out: [true, false, false, false] },
      { args: [['127.0.0.1', '300.0.0.1', '8.8.8.8', '-1.2.3.4']], out: [true, false, true, false] },
      { args: [['1.2.3.+4', '1.2.3. 4', '1.2.3.4a', '00.0.0.0']], out: [false, false, false, false] },
      { args: [['10.10.10.10', '199.99.9.0', '1.1.1.256', '255.0.255.0']], out: [true, true, false, true] },
    ],
    hint: 'Split on dots, then check each part\'s characters yourself. In Python, int(" 4") and int("+4") both succeed, so int() alone lets bad addresses through.',
    approach: 'Split each address on ".". It must have exactly 4 parts. Each part must be 1–3 characters, all of them 0–9, with no leading zero unless it is exactly "0", and its value at most 255.',
    complexity: 'O(total characters) time, O(1) extra space per address.',
    solution: {
      py: `def validateAddresses(addresses):
    def valid(address):
        parts = address.split('.')
        if len(parts) != 4:
            return False
        for part in parts:
            if not part or len(part) > 3 or any(c not in '0123456789' for c in part):
                return False
            if len(part) > 1 and part[0] == '0':
                return False
            if int(part) > 255:
                return False
        return True

    return [valid(a) for a in addresses]`,
      js: `function validateAddresses(addresses) {
  return addresses.map((address) => {
    const parts = address.split('.');
    return parts.length === 4 && parts.every((part) =>
      /^[0-9]{1,3}$/.test(part) &&
      (part === '0' || part[0] !== '0') &&
      Number(part) <= 255);
  });
}`,
    },
  },

  {
    id: 'top-errors', title: 'Top Error Codes', diff: 'E', time: 15, tags: ['Hash map', 'Sorting'],
    fn: 'topErrors',
    params: [['int[]', 'codes', 'the status code of every failed request'], ['int', 'k', 'how many codes to return']],
    returns: ['int[]', 'the k most frequent codes, most frequent first'],
    story: '<p>Your monitoring system records the HTTP status code of every failed request. For the on-call dashboard, return the <code>k</code> most frequent codes, most frequent first.</p><p>If two codes appear the same number of times, the smaller code comes first.</p>',
    constraints: ['1 ≤ length of codes ≤ 10⁵', '1 ≤ k ≤ number of distinct codes', '400 ≤ codes[i] ≤ 599'],
    samples: 2,
    tests: [
      { args: [[500, 404, 500, 503, 404, 500], 2], out: [500, 404], why: '500 appears 3 times, 404 twice, 503 once.' },
      { args: [[502, 503, 502, 503, 504], 2], out: [502, 503], why: '502 and 503 tie with 2 each, so the smaller code goes first.' },
      { args: [[404], 1], out: [404] },
      { args: [[500, 500, 401, 401, 403, 403, 403], 3], out: [403, 401, 500] },
      { args: [[429, 500, 429, 503, 503, 429, 500, 500], 1], out: [429] },
      { args: [[599, 400, 599, 400, 450], 3], out: [400, 599, 450] },
      { make: () => ({ args: [[...Array(50000).fill(500), ...Array(30000).fill(404), ...Array(20000).fill(503)], 2], out: [500, 404] }) },
    ],
    hint: 'Count first, then sort the distinct codes with a key that handles the tie-break.',
    approach: 'Count each code with a hash map. Sort the distinct codes by (count descending, code ascending) and take the first k. With at most 200 distinct codes the sort is cheap; for huge numbers of distinct values, a heap of size k avoids sorting everything.',
    complexity: 'O(n + d log d) time where d is the number of distinct codes, O(d) space.',
    solution: {
      py: `from collections import Counter

def topErrors(codes, k):
    counts = Counter(codes)
    ranked = sorted(counts, key=lambda code: (-counts[code], code))
    return ranked[:k]`,
      js: `function topErrors(codes, k) {
  const counts = new Map();
  for (const code of codes) counts.set(code, (counts.get(code) || 0) + 1);
  return [...counts.keys()]
    .sort((a, b) => counts.get(b) - counts.get(a) || a - b)
    .slice(0, k);
}`,
    },
  },

  {
    id: 'pairs', title: 'Latency Pairs', diff: 'E', time: 15, tags: ['Hash set'],
    fn: 'countPairs',
    params: [['int[]', 'times', 'distinct response times in milliseconds'], ['int', 'k', 'the target difference']],
    returns: ['int', 'how many pairs differ by exactly k'],
    story: '<p>You are comparing response times from a load test. Given a list of <strong>distinct</strong> times and a number <code>k</code>, count the pairs of values whose difference is exactly <code>k</code>.</p><p>Each unordered pair counts once.</p>',
    constraints: ['1 ≤ length of times ≤ 10⁵', '1 ≤ k ≤ 10⁹', 'all values are distinct, 0 ≤ times[i] ≤ 10⁹'],
    samples: 2,
    tests: [
      { args: [[1, 5, 3, 4, 2], 2], out: 3, why: 'The pairs are (1, 3), (3, 5) and (2, 4).' },
      { args: [[10, 20, 30], 10], out: 2, why: '(10, 20) and (20, 30).' },
      { args: [[7], 3], out: 0 },
      { args: [[1, 3, 5, 7, 9], 4], out: 3 },
      { args: [[100, 1, 50, 51, 2], 1], out: 2 },
      { args: [[0, 1000000000], 1000000000], out: 1 },
      { make: () => ({ args: [Array.from({ length: 100000 }, (_, i) => i), 1], out: 99999 }) },
      { make: () => ({ args: [Array.from({ length: 100000 }, (_, i) => i * 2).reverse(), 2], out: 99999 }) },
    ],
    hint: 'Checking every pair is O(n²), too slow for 10⁵ values. For each value t, you only need to know whether t + k exists.',
    approach: 'Put every value in a hash set. For each value t, count it if t + k is in the set. Looking only at t + k (not t − k) counts each pair exactly once.',
    complexity: 'O(n) time, O(n) space.',
    solution: {
      py: `def countPairs(times, k):
    seen = set(times)
    return sum(1 for t in times if t + k in seen)`,
      js: `function countPairs(times, k) {
  const seen = new Set(times);
  return times.filter((t) => seen.has(t + k)).length;
}`,
    },
  },

  {
    id: 'windows', title: 'Merge Maintenance Windows', diff: 'M', time: 25, tags: ['Intervals', 'Sorting'],
    fn: 'mergeWindows',
    params: [['int[][]', 'windows', 'each window is [start, end] in minutes, inclusive']],
    returns: ['int[][]', 'the merged windows, sorted by start'],
    story: '<p>Several teams booked maintenance windows on a shared cluster, each as <code>[start, end]</code> (inclusive). To publish one clean schedule, merge every window that overlaps or touches another, and return the result sorted by start time.</p><p>Two windows touch when one ends at the exact minute the next starts, like <code>[1, 4]</code> and <code>[4, 5]</code>.</p>',
    constraints: ['0 ≤ number of windows ≤ 10⁵', '0 ≤ start ≤ end ≤ 10⁹', 'windows can be in any order'],
    samples: 2,
    tests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], out: [[1, 6], [8, 10], [15, 18]], why: '[1, 3] and [2, 6] overlap, so they become [1, 6].' },
      { args: [[[1, 4], [4, 5]]], out: [[1, 5]], why: 'They touch at minute 4.' },
      { args: [[]], out: [] },
      { args: [[[5, 7], [1, 2]]], out: [[1, 2], [5, 7]] },
      { args: [[[1, 10], [2, 3], [4, 5]]], out: [[1, 10]] },
      { args: [[[6, 8], [1, 9], [2, 4], [4, 7]]], out: [[1, 9]] },
      { args: [[[1, 1], [2, 2], [2, 3]]], out: [[1, 1], [2, 3]] },
      {
        make: () => {
          const out = Array.from({ length: 50000 }, (_, i) => [i * 3, i * 3 + 1]);
          return { args: [out.map((w) => [...w]).reverse()], out };
        },
      },
    ],
    hint: 'Once the windows are sorted by start, each one can only merge with the last window you kept.',
    approach: 'Sort by start. Walk through the windows keeping a merged list: if the current window starts at or before the end of the last merged one, extend that window\'s end to the larger of the two ends; otherwise start a new merged window.',
    complexity: 'O(n log n) time for the sort, O(n) space for the output.',
    solution: {
      py: `def mergeWindows(windows):
    merged = []
    for start, end in sorted(windows):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      js: `function mergeWindows(windows) {
  const sorted = windows.map((w) => [...w]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}`,
    },
  },

  {
    id: 'machines', title: 'How Many Machines?', diff: 'M', time: 25, tags: ['Intervals', 'Sweep line', 'Heap'],
    fn: 'minMachines',
    params: [['int[][]', 'jobs', 'each job is [start, end): it needs a machine from start up to, but not including, end']],
    returns: ['int', 'the fewest machines that can run every job on time'],
    story: '<p>Batch jobs run on identical machines, one job per machine at a time. Each job is <code>[start, end)</code>: it occupies a machine from <code>start</code> up to but not including <code>end</code>, so a job ending at 10 frees its machine for a job starting at 10.</p><p>Return the minimum number of machines needed to run every job at its scheduled time.</p>',
    constraints: ['0 ≤ number of jobs ≤ 10⁵', '0 ≤ start < end ≤ 10⁹'],
    samples: 2,
    tests: [
      { args: [[[0, 30], [5, 10], [15, 20]]], out: 2, why: 'The long job overlaps each short one, but the short ones never overlap each other.' },
      { args: [[[1, 5], [5, 10], [10, 15]]], out: 1, why: 'Each job starts exactly when the previous one frees the machine.' },
      { args: [[[7, 10], [2, 4]]], out: 1 },
      { args: [[[1, 10], [2, 9], [3, 8], [4, 7]]], out: 4 },
      { args: [[]], out: 0 },
      { args: [[[1, 3], [2, 4], [3, 5], [4, 6]]], out: 2 },
      { args: [[[5, 6], [1, 2], [1, 3], [2, 6], [3, 7]]], out: 3 },
      { make: () => ({ args: [Array.from({ length: 100000 }, (_, i) => [i, i + 2])], out: 2 }) },
    ],
    hint: 'The answer is the largest number of jobs running at the same moment. Sort the start times and the end times separately.',
    approach: 'Sort all start times and all end times. Sweep through the starts in order; before counting a new job, release every machine whose job ended at or before this start. The peak number of busy machines is the answer. A min-heap of end times works too.',
    complexity: 'O(n log n) time, O(n) space.',
    solution: {
      py: `def minMachines(jobs):
    starts = sorted(s for s, _ in jobs)
    ends = sorted(e for _, e in jobs)
    busy = best = j = 0
    for s in starts:
        # Free every machine whose job has finished by now
        while j < len(ends) and ends[j] <= s:
            busy -= 1
            j += 1
        busy += 1
        best = max(best, busy)
    return best`,
      js: `function minMachines(jobs) {
  const starts = jobs.map((job) => job[0]).sort((a, b) => a - b);
  const ends = jobs.map((job) => job[1]).sort((a, b) => a - b);
  let busy = 0, best = 0, j = 0;
  for (const s of starts) {
    // Free every machine whose job has finished by now
    while (j < ends.length && ends[j] <= s) { busy--; j++; }
    busy++;
    best = Math.max(best, busy);
  }
  return best;
}`,
    },
  },

  {
    id: 'budget', title: 'Longest Run Under Budget', diff: 'M', time: 25, tags: ['Sliding window'],
    fn: 'longestUnderBudget',
    params: [['int[]', 'costs', 'what the account spent each day; always positive'], ['int', 'budget', 'the most a run of days may cost in total']],
    returns: ['int', 'the length of the longest run of consecutive days within budget'],
    story: '<p><code>costs[i]</code> is what your cloud account spent on day <code>i</code>. Every day costs something, so all values are positive.</p><p>Find the length of the longest run of <strong>consecutive</strong> days whose total spend is at most <code>budget</code>. Return 0 if not even a single day fits.</p>',
    constraints: ['1 ≤ length of costs ≤ 10⁵', '1 ≤ costs[i] ≤ 10⁴', '1 ≤ budget ≤ 10⁹'],
    samples: 2,
    tests: [
      { args: [[3, 1, 2, 7, 4, 2, 1, 1, 5], 8], out: 4, why: 'Days 4–7 cost 4 + 2 + 1 + 1 = 8.' },
      { args: [[5, 5, 5], 4], out: 0, why: 'Every single day already costs more than 4.' },
      { args: [[1, 1, 1, 1], 10], out: 4 },
      { args: [[10], 10], out: 1 },
      { args: [[2, 2, 2, 9, 1, 1, 1, 1, 1], 5], out: 5 },
      { args: [[4, 3, 2, 1], 6], out: 3 },
      { args: [[8, 1, 1, 8, 1, 1, 1, 8], 3], out: 3 },
      { make: () => ({ args: [Array(100000).fill(1), 50000], out: 50000 }) },
    ],
    hint: 'Because every cost is positive, adding a day can only raise the total and dropping the oldest day can only lower it. That makes a two-pointer window work.',
    approach: 'Grow a window by moving its right edge one day at a time and adding that day\'s cost. While the total is over budget, drop days from the left. After each step, the window is the longest valid run ending at that day, so track the best length.',
    complexity: 'O(n) time (each day enters and leaves the window once), O(1) space.',
    solution: {
      py: `def longestUnderBudget(costs, budget):
    best = total = left = 0
    for right, cost in enumerate(costs):
        total += cost
        while total > budget:
            total -= costs[left]
            left += 1
        best = max(best, right - left + 1)
    return best`,
      js: `function longestUnderBudget(costs, budget) {
  let best = 0, total = 0, left = 0;
  for (let right = 0; right < costs.length; right++) {
    total += costs[right];
    while (total > budget) total -= costs[left++];
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    },
  },

  {
    id: 'rate-limit', title: 'Sliding Window Rate Limiter', diff: 'M', time: 25, tags: ['Queue', 'Simulation'],
    fn: 'allowRequests',
    params: [['int[]', 'times', 'request arrival times in seconds, sorted, may repeat'], ['int', 'limit', 'allowed requests per window'], ['int', 'window', 'window length in seconds']],
    returns: ['boolean[]', 'whether each request is allowed'],
    story: '<p>An API gateway lets a client make at most <code>limit</code> requests in any <code>window</code>-second period. A request at time <code>t</code> is allowed if fewer than <code>limit</code> <em>allowed</em> requests happened in the interval <code>(t − window, t]</code>. Rejected requests don\'t count toward the limit.</p><p>Requests arrive at the given times (sorted, possibly several in the same second). Return whether each one is allowed.</p>',
    constraints: ['0 ≤ length of times ≤ 10⁵', '1 ≤ limit ≤ 10⁵', '1 ≤ window ≤ 10⁶'],
    samples: 2,
    tests: [
      { args: [[1, 2, 3, 11, 12], 2, 10], out: [true, true, false, true, true], why: 'At t=3, two allowed requests are already in (−7, 3]. By t=11 the request at 1 has left the window (11 − 10 = 1 is excluded).' },
      { args: [[0, 0, 0, 0], 3, 1], out: [true, true, true, false], why: 'Only three requests fit in the same second.' },
      { args: [[], 5, 60], out: [] },
      { args: [[1, 1, 2, 2, 3, 3], 2, 2], out: [true, true, false, false, true, true] },
      { args: [[5, 10, 15, 20], 1, 5], out: [true, true, true, true] },
      { args: [[5, 9, 10, 14, 15], 1, 5], out: [true, false, true, false, true] },
      { args: [[1, 2, 3, 4, 5, 6], 3, 100], out: [true, true, true, false, false, false] },
      { make: () => ({ args: [Array.from({ length: 100000 }, (_, i) => i), 10, 100], out: Array.from({ length: 100000 }, (_, i) => i % 100 < 10) }) },
    ],
    hint: 'Keep the times of allowed requests that are still inside the window. Old ones always leave from the front.',
    approach: 'Use a queue of allowed request times. For each new request at t, drop times ≤ t − window from the front. If fewer than limit remain, allow it and push t; otherwise reject it. Since times are sorted, every time is pushed and popped at most once.',
    complexity: 'O(n) time, O(limit) space.',
    solution: {
      py: `from collections import deque

def allowRequests(times, limit, window):
    recent = deque()   # allowed requests still inside the window
    result = []
    for t in times:
        while recent and recent[0] <= t - window:
            recent.popleft()
        if len(recent) < limit:
            recent.append(t)
            result.append(True)
        else:
            result.append(False)
    return result`,
      js: `function allowRequests(times, limit, window) {
  const recent = []; // allowed requests still inside the window
  let head = 0;      // index of the oldest one, so dropping is O(1)
  return times.map((t) => {
    while (head < recent.length && recent[head] <= t - window) head++;
    if (recent.length - head < limit) {
      recent.push(t);
      return true;
    }
    return false;
  });
}`,
    },
  },

  {
    id: 'deploy-order', title: 'Deployment Order', diff: 'M', time: 25, tags: ['Graphs', 'Topological sort', 'Heap'],
    fn: 'deployOrder',
    params: [['int', 'n', 'number of services, numbered 0 to n − 1'], ['int[][]', 'deps', 'each [a, b] means a must be deployed before b']],
    returns: ['int[]', 'a valid deploy order, or an empty list if there is a cycle'],
    story: '<p>A release deploys <code>n</code> services, numbered <code>0</code> to <code>n − 1</code>. Some depend on others: a pair <code>[a, b]</code> means service <code>a</code> must be deployed before service <code>b</code>.</p><p>Return an order that deploys every service and respects every dependency. Whenever several services are ready at once, deploy the <strong>smallest number first</strong>, so the answer is unique. If the dependencies contain a cycle, no order exists: return an empty list.</p>',
    constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ number of deps ≤ 2 × 10⁵', '0 ≤ a, b < n'],
    samples: 2,
    tests: [
      { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], out: [0, 1, 2, 3], why: '0 first; then 1 and 2 are ready, smallest first; 3 needs both.' },
      { args: [3, [[0, 1], [1, 2], [2, 0]]], out: [], why: '0 → 1 → 2 → 0 is a cycle.' },
      { args: [3, []], out: [0, 1, 2] },
      { args: [5, [[3, 0], [3, 1], [4, 1], [1, 2]]], out: [3, 0, 4, 1, 2] },
      { args: [1, []], out: [0] },
      { args: [4, [[1, 0], [2, 0], [3, 0]]], out: [1, 2, 3, 0] },
      { args: [2, [[0, 0]]], out: [] },
      { args: [6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]], out: [4, 5, 0, 2, 3, 1] },
      { make: () => ({ args: [50000, Array.from({ length: 49999 }, (_, i) => [i, i + 1])], out: Array.from({ length: 50000 }, (_, i) => i) }) },
    ],
    hint: 'A service is ready once all of its prerequisites are deployed. Count unfinished prerequisites per service (its in-degree), and always pick the smallest ready service.',
    approach: 'Kahn\'s algorithm. Count each service\'s prerequisites. Put every service with zero into a min-heap. Repeatedly pop the smallest, add it to the order, and decrement the count of everything that depends on it, pushing any that reach zero. If the order ends up shorter than n, some services were stuck waiting on each other: a cycle.',
    complexity: 'O((n + d) log n) time with the heap, O(n + d) space.',
    solution: {
      py: `import heapq

def deployOrder(n, deps):
    after = [[] for _ in range(n)]
    waiting = [0] * n   # unfinished prerequisites per service
    for a, b in deps:
        after[a].append(b)
        waiting[b] += 1

    ready = [s for s in range(n) if waiting[s] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        s = heapq.heappop(ready)
        order.append(s)
        for nxt in after[s]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                heapq.heappush(ready, nxt)
    return order if len(order) == n else []`,
      js: `function deployOrder(n, deps) {
  const after = Array.from({ length: n }, () => []);
  const waiting = new Array(n).fill(0); // unfinished prerequisites per service
  for (const [a, b] of deps) {
    after[a].push(b);
    waiting[b]++;
  }

  // JavaScript has no built-in heap, so here's a small min-heap
  const heap = [];
  const push = (x) => {
    heap.push(x);
    for (let i = heap.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l] < heap[m]) m = l;
        if (r < heap.length && heap[r] < heap[m]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  for (let s = 0; s < n; s++) if (waiting[s] === 0) push(s);
  const order = [];
  while (heap.length) {
    const s = pop();
    order.push(s);
    for (const next of after[s]) if (--waiting[next] === 0) push(next);
  }
  return order.length === n ? order : [];
}`,
    },
  },

  {
    id: 'outage', title: 'Outage Spread', diff: 'M', time: 25, tags: ['Graphs', 'BFS', 'Grid'],
    fn: 'minutesToFail',
    params: [['int[][]', 'grid', '0 = empty slot, 1 = healthy server, 2 = failed server']],
    returns: ['int', 'minutes until no healthy server is left, or −1 if some can never fail'],
    story: '<p>A data center floor is a grid of rack slots: <code>0</code> is empty, <code>1</code> is a healthy server and <code>2</code> is a failed server. Every minute, each failed server knocks out the healthy servers directly above, below, left and right of it.</p><p>Return the number of minutes until no healthy server remains. If some healthy server can never be reached, return <code>-1</code>. If there are no healthy servers to begin with, return <code>0</code>.</p>',
    constraints: ['1 ≤ rows, columns ≤ 300', 'grid[r][c] is 0, 1 or 2'],
    samples: 2,
    tests: [
      { args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], out: 4, why: 'The failure spreads out from the top-left corner and reaches the bottom-right server in minute 4.' },
      { args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], out: -1, why: 'The bottom-left server has no failed neighbour path, so it never fails.' },
      { args: [[[0, 2]]], out: 0 },
      { args: [[[1]]], out: -1 },
      { args: [[[2, 2], [2, 2]]], out: 0 },
      { args: [[[2, 1, 1, 1, 1]]], out: 4 },
      { args: [[[1, 1, 1], [1, 2, 1], [1, 1, 1]]], out: 2 },
      { args: [[[2, 1, 0, 1, 2]]], out: 1 },
      {
        make: () => {
          const grid = Array.from({ length: 300 }, () => Array(300).fill(1));
          grid[0][0] = 2;
          return { args: [grid], out: 598 };
        },
      },
    ],
    hint: 'All failed servers spread at the same time. Start a breadth-first search from every one of them at once.',
    approach: 'Multi-source BFS. Put every failed server in the queue at minute 0 and count the healthy ones. Pop a server, fail each healthy neighbour, record minute + 1, and queue it. When the queue empties, return the last minute if every healthy server failed, otherwise −1.',
    complexity: 'O(rows × columns) time and space.',
    solution: {
      py: `from collections import deque

def minutesToFail(grid):
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    healthy = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c, 0))
            elif grid[r][c] == 1:
                healthy += 1

    minutes = 0
    while queue:
        r, c, m = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                healthy -= 1
                minutes = m + 1
                queue.append((nr, nc, m + 1))
    return minutes if healthy == 0 else -1`,
      js: `function minutesToFail(grid) {
  const rows = grid.length, cols = grid[0].length;
  const queue = [];
  let healthy = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c, 0]);
      else if (grid[r][c] === 1) healthy++;
    }
  }

  let minutes = 0;
  for (let head = 0; head < queue.length; head++) {
    const [r, c, m] = queue[head];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
        grid[nr][nc] = 2;
        healthy--;
        minutes = m + 1;
        queue.push([nr, nc, m + 1]);
      }
    }
  }
  return healthy === 0 ? minutes : -1;
}`,
    },
  },

  {
    id: 'provision', title: 'Cheapest Provisioning', diff: 'M', time: 25, tags: ['Dynamic programming'],
    fn: 'cheapestCost',
    params: [['int[][]', 'types', 'each instance type is [vcpus, hourlyCost]'], ['int', 'target', 'exact number of vCPUs needed']],
    returns: ['int', 'the lowest total hourly cost, or −1 if target can\'t be hit exactly'],
    story: '<p>A workload needs <strong>exactly</strong> <code>target</code> vCPUs. Each instance type is <code>[vcpus, hourlyCost]</code>, and you can launch as many instances of each type as you like.</p><p>Return the lowest total hourly cost that adds up to exactly <code>target</code> vCPUs, or <code>-1</code> if no combination does. A target of 0 costs 0.</p>',
    constraints: ['1 ≤ number of types ≤ 20', '1 ≤ vcpus ≤ 100, 1 ≤ hourlyCost ≤ 10⁴', '0 ≤ target ≤ 10⁴'],
    samples: 2,
    tests: [
      { args: [[[2, 3], [4, 5], [8, 9]], 8], out: 9, why: 'One 8-vCPU instance (9) beats two 4s (10) or four 2s (12).' },
      { args: [[[3, 4]], 7], out: -1, why: 'Multiples of 3 never add up to 7.' },
      { args: [[[1, 2], [5, 8]], 0], out: 0 },
      { args: [[[2, 5], [3, 7]], 7], out: 17 },
      { args: [[[1, 1], [10, 20]], 10], out: 10 },
      { args: [[[4, 10], [6, 13]], 12], out: 26 },
      { args: [[[5, 9], [7, 12], [2, 4]], 11], out: 20 },
      { args: [[[3, 5], [7, 11], [11, 17], [13, 19]], 10000], out: 14616 },
    ],
    hint: 'This is coin change with prices: the cheapest way to reach v vCPUs is one instance plus the cheapest way to reach the rest.',
    approach: 'Bottom-up DP. best[v] is the cheapest cost for exactly v vCPUs; best[0] = 0 and everything else starts at infinity. For each v from 1 to target, try every type that fits: best[v] = min(best[v], best[v − vcpus] + cost). The answer is best[target], or −1 if it is still infinity. Greedy (always the cheapest per vCPU) fails on cases like the second sample.',
    complexity: 'O(target × types) time, O(target) space.',
    solution: {
      py: `def cheapestCost(types, target):
    INF = float('inf')
    best = [0] + [INF] * target   # best[v] = cheapest way to get exactly v vCPUs
    for v in range(1, target + 1):
        for cpus, cost in types:
            if cpus <= v and best[v - cpus] + cost < best[v]:
                best[v] = best[v - cpus] + cost
    return best[target] if best[target] < INF else -1`,
      js: `function cheapestCost(types, target) {
  const best = new Array(target + 1).fill(Infinity); // best[v] = cheapest way to get exactly v vCPUs
  best[0] = 0;
  for (let v = 1; v <= target; v++) {
    for (const [cpus, cost] of types) {
      if (cpus <= v && best[v - cpus] + cost < best[v]) best[v] = best[v - cpus] + cost;
    }
  }
  return best[target] === Infinity ? -1 : best[target];
}`,
    },
  },

  {
    id: 'largest-bst', title: 'Largest BST Subtree', diff: 'M', time: 30, tags: ['Trees', 'DFS'],
    fn: 'largestBst',
    params: [['int[]', 'values', 'the tree in level order, with None (null in JavaScript) for a missing child']],
    returns: ['int', 'how many nodes the largest BST subtree has'],
    story: '<p class="chal-reported">Reported on Glassdoor from an IBM Cloud Developer technical round.</p><p>Given a binary tree, find its largest <strong>subtree</strong> that is a valid binary search tree: every value in a node\'s left subtree is <strong>strictly smaller</strong> than the node, and every value in its right subtree is <strong>strictly larger</strong>. A subtree is a node together with <em>all</em> of its descendants.</p><p>Return the number of nodes in that subtree, or 0 for an empty tree.</p><p>The tree arrives as a level-order list, the way LeetCode writes trees: <code>[10, 5, 15]</code> is 10 with children 5 and 15. The starter code includes <code>build(values)</code>, which turns the list into <code>Node</code> objects with <code>val</code>, <code>left</code> and <code>right</code>.</p>',
    constraints: ['0 ≤ number of nodes ≤ 12,000', '−10⁵ ≤ node value ≤ 10⁵', 'The tree is at most 200 levels deep'],
    samples: 2,
    tests: [
      { args: [[8, 3, 12, 1, 6, null, 9]], out: 3, why: '9 is in 12\'s right subtree but smaller than 12, so neither 12 nor the root qualifies. The subtree 3 → 1, 6 is valid.' },
      { args: [[5, 4, 6, null, null, 3, 7]], out: 3, why: 'Every parent and child look fine, but 3 is in 5\'s right subtree and smaller than 5, so the whole tree fails. 6 → 3, 7 is the largest valid subtree.' },
      { args: [[]], out: 0 },
      { args: [[42]], out: 1 },
      { args: [[2, 1, 3]], out: 3 },
      { args: [[3, 2, 4, null, null, 1]], out: 2 },
      { args: [[1, 1, 1]], out: 1 },
      { args: [[10, 5, 15, 1, 8, 12, 20]], out: 7 },
      { args: [[-5, -10, 0]], out: 3 },
      { args: [[4, 2, 7, 2, 3, 5, null, 2, null, null, null, null, null, 1]], out: 2 },
      { args: [[5, null, 4, null, 3, null, 2, null, 1]], out: 1 },
      { make: () => ({ args: [[1, ...Array.from({ length: 199 }, (_, k) => [null, k + 2]).flat()]], out: 200 }) },
      { make: () => ({ args: [bstLevelOrder(1, 12000)], out: 12000 }) },
      { make: () => { const v = bstLevelOrder(1, 12000); v[0] = 0; return { args: [v], out: 6000 }; } },
      { make: () => { const v = bstLevelOrder(1, 12000); v[v.indexOf(12000)] = 1; return { args: [v], out: 5999 }; } },
    ],
    starter: {
      py: TREE_PY + `
def largestBst(values):
    root = build(values)
    # Write your code here
    pass
`,
      js: TREE_JS + `
function largestBst(values) {
  const root = build(values);
  // Write your code here
}
`,
    },
    hint: 'Checking each node only against its children isn\'t enough (see sample 1). What would a parent need to know from each child to decide, in one step, whether it\'s a BST too?',
    approach: 'Post-order DFS: handle both children before the node. Each call returns whether its subtree is a BST, plus its size, smallest value and largest value. A node is a BST when both children are and left.max &lt; node.val &lt; right.min; its size is left + right + 1. An empty child counts as a BST of size 0 with min = +∞ and max = −∞, so leaves need no special case. Track the biggest size seen. Re-validating every subtree from scratch is O(n²) on a long chain.',
    complexity: 'O(n) time, O(h) space for the recursion, where h is the height.',
    solution: {
      py: TREE_PY + `
def largestBst(values):
    root = build(values)
    best = 0

    # Returns (size, smallest, largest) if node's subtree is a BST, else None
    def walk(node):
        nonlocal best
        if node is None:
            return 0, float('inf'), float('-inf')
        left, right = walk(node.left), walk(node.right)
        if left is None or right is None or not left[2] < node.val < right[1]:
            return None
        size = left[0] + right[0] + 1
        best = max(best, size)
        return size, min(left[1], node.val), max(right[2], node.val)

    walk(root)
    return best`,
      js: TREE_JS + `
function largestBst(values) {
  const root = build(values);
  let best = 0;
  // Returns [size, smallest, largest] if node's subtree is a BST, else null
  const walk = (node) => {
    if (!node) return [0, Infinity, -Infinity];
    const left = walk(node.left), right = walk(node.right);
    if (!left || !right || !(left[2] < node.val && node.val < right[1])) return null;
    const size = left[0] + right[0] + 1;
    best = Math.max(best, size);
    return [size, Math.min(left[1], node.val), Math.max(right[2], node.val)];
  };
  walk(root);
  return best;
}`,
    },
  },
];

/* --------------------------------------------------------------------------
   Multiple-choice quiz: o = options, a = index of the right one, why = explanation
   -------------------------------------------------------------------------- */
PREP.quiz = [
  { c: 'Cloud basics', q: 'In which service model does the customer manage the operating system?', o: ['SaaS', 'PaaS', 'IaaS', 'FaaS (serverless functions)'], a: 2, why: 'With IaaS you rent virtual machines and manage everything from the OS up. PaaS and serverless manage the runtime for you; SaaS is finished software.' },
  { c: 'Cloud basics', q: 'A hospital keeps patient records in its own data center and runs its patient portal on a public cloud, with a secure connection between them. What is this?', o: ['Multicloud', 'Hybrid cloud', 'Private cloud', 'Edge computing'], a: 1, why: 'Hybrid cloud connects private or on-prem infrastructure with public cloud. Multicloud means using more than one public provider.' },
  { c: 'Cloud basics', q: 'Which metric describes how much data loss is acceptable after a disaster?', o: ['RTO', 'RPO', 'SLA', 'MTTR'], a: 1, why: 'RPO (recovery point objective) is how much data you can afford to lose; RTO is how quickly you must recover.' },
  { c: 'Cloud basics', q: 'Under the shared responsibility model for IaaS, who patches the virtual machine\'s operating system?', o: ['The cloud provider', 'The customer', 'Whoever notices first', 'The hardware vendor'], a: 1, why: 'On IaaS the provider secures the hardware and hypervisor; the guest OS, apps and data are yours.' },
  { c: 'Cloud basics', q: 'Running instances across several availability zones mainly protects against:', o: ['A whole region going down', 'One data center failing', 'A buggy deploy', 'Leaked credentials'], a: 1, why: 'Zones are separate data centers within one region. Surviving a region outage takes multi-region deployment.' },
  { c: 'Cloud basics', q: 'Which change makes a web service easiest to scale horizontally?', o: ['Storing user sessions in each server\'s memory', 'Making the service stateless and keeping state in a shared database or cache', 'Using a bigger virtual machine', 'Writing uploads to the local disk'], a: 1, why: 'If no request depends on a particular instance, any instance can serve any request and you scale by adding copies.' },

  { c: 'AWS', q: 'What is the longest a single AWS Lambda invocation can run?', o: ['5 minutes', '15 minutes', '1 hour', 'No limit'], a: 1, why: 'Lambda caps each invocation at 15 minutes. Longer work belongs on ECS/Fargate, or split into steps with Step Functions.' },
  { c: 'AWS', q: 'How should a Lambda function get permission to write to a DynamoDB table?', o: ['Access keys in an environment variable', 'An execution role whose policy allows writing to that table', 'Making the table public', 'A security group rule'], a: 1, why: 'The function assumes its IAM execution role and gets short-lived credentials automatically. No keys are stored anywhere.' },
  { c: 'AWS', q: 'Which of these can Lambda read in batches for you, without you writing any polling code?', o: ['An SQS queue', 'A Route 53 record', 'A CloudFront distribution', 'An IAM policy'], a: 0, why: 'SQS, DynamoDB Streams and Kinesis are poll-based sources: Lambda polls them and invokes your function with batches of records.' },
  { c: 'AWS', q: 'One event has to reach three services that each process it at their own pace. What is the common AWS pattern?', o: ['One SQS queue that all three read', 'An SNS topic fanning out to three SQS queues', 'Three Route 53 records', 'A single larger Lambda'], a: 1, why: 'SNS copies the message to every subscribed queue, and each queue buffers work for its own consumer. With one shared queue, each message would go to only one service.' },
  { c: 'AWS', q: 'Where should messages go that fail processing again and again?', o: ['They should be deleted', 'A dead-letter queue', 'CloudFront', 'A NAT gateway'], a: 1, why: 'A DLQ keeps the bad message for inspection instead of letting it block the queue or retry forever. Put an alarm on it.' },
  { c: 'AWS', q: 'Which load balancer can route HTTP requests by URL path, like /api to one service and everything else to another?', o: ['Network Load Balancer', 'Application Load Balancer', 'Gateway Load Balancer', 'Route 53 alone'], a: 1, why: 'The ALB works at layer 7 and understands HTTP. The NLB works at layer 4 and only sees TCP/UDP connections.' },
  { c: 'AWS', q: 'Which is stateful and is attached directly to resources like EC2 instances?', o: ['Network ACL', 'Security group', 'Route table', 'Internet gateway'], a: 1, why: 'Security groups track connections, so replies are allowed automatically. Network ACLs attach to subnets and are stateless.' },
  { c: 'AWS', q: '"Who deleted this S3 bucket, and when?" Where do you look?', o: ['CloudWatch metrics', 'CloudTrail', 'X-Ray', 'Route 53'], a: 1, why: 'CloudTrail records every API call in the account: who made it, when and from where. CloudWatch is for metrics, logs and alarms.' },
  { c: 'AWS', q: 'Your data has nurses, surgeries and assignments that need joins and transactions. Which AWS database fits best?', o: ['DynamoDB', 'RDS for PostgreSQL', 'S3', 'ElastiCache'], a: 1, why: 'Relational data with joins and multi-table transactions belongs in a relational database like RDS or Aurora.' },
  { c: 'AWS', q: 'In DynamoDB, what do efficient queries depend on?', o: ['Any column in a WHERE clause', 'The partition key (plus optional sort key) or a secondary index', 'Full table scans', 'JOINs between tables'], a: 1, why: 'DynamoDB looks items up by key. Design the keys and indexes around your access patterns; scans read the whole table and get slow and expensive.' },
  { c: 'AWS', q: 'How do you serve a React build worldwide from an S3 bucket without making the bucket public?', o: ['Turn off Block Public Access', 'Put CloudFront in front, using origin access control', 'Run an EC2 web server', 'Point Route 53 straight at the bucket'], a: 1, why: 'CloudFront caches the files at the edge, and origin access control lets only CloudFront read the private bucket.' },
  { c: 'AWS', q: 'A Lambda function\'s first request after a quiet period is noticeably slow. What is this?', o: ['Throttling', 'A cold start', 'A DNS timeout', 'An IAM error'], a: 1, why: 'A new copy has to be created and initialized first. Smaller packages, reusing clients across calls, and provisioned concurrency all help.' },
  { c: 'AWS', q: 'Which lets you run containers without managing any EC2 instances?', o: ['Fargate', 'EBS', 'S3 Glacier', 'Route 53'], a: 0, why: 'Fargate runs ECS tasks or EKS pods on capacity AWS manages. You set CPU and memory, never a server.' },
  { c: 'AWS', q: 'Which service coordinates a multi-step workflow with retries, branches and waits?', o: ['Step Functions', 'CloudFront', 'KMS', 'Parameter Store'], a: 0, why: 'Step Functions runs a state machine, tracks every execution, and handles retries and errors for each step.' },
  { c: 'AWS', q: 'During a spike, many Lambda copies exhaust your PostgreSQL database\'s connections. What is the standard fix?', o: ['Increase the Lambda timeout', 'Put RDS Proxy between Lambda and the database', 'Use a bigger S3 bucket', 'Turn off logging'], a: 1, why: 'Each Lambda copy opens its own connections. RDS Proxy pools and reuses them so the database isn\'t overwhelmed.' },
  { c: 'AWS', q: 'Where should a database password that must rotate automatically live?', o: ['Secrets Manager', 'A plain-text Lambda environment variable', 'A public S3 bucket', 'The source code'], a: 0, why: 'Secrets Manager stores secrets encrypted with KMS, controls access through IAM, and can rotate RDS credentials on a schedule.' },
  { c: 'AWS', q: 'What is AWS SAM?', o: ['An extension of CloudFormation for defining and deploying serverless apps', 'A NoSQL database', 'A type of load balancer', 'A monitoring agent'], a: 0, why: 'SAM templates describe functions, APIs and tables in a few lines, and the SAM CLI builds, tests and deploys them as a CloudFormation stack.' },
  { c: 'AWS', q: 'What does running RDS in Multi-AZ mode give you?', o: ['Faster queries', 'A standby in another zone that takes over automatically', 'Free unlimited backups', 'A copy in every region'], a: 1, why: 'Multi-AZ keeps a synchronous standby in a second zone for automatic failover. Read replicas are what spread read traffic.' },
  { c: 'AWS', q: 'Servers in a private subnet need to download updates. What lets them reach the internet without being reachable from it?', o: ['An internet gateway on the private subnet', 'A NAT gateway in a public subnet', 'CloudFront', 'An S3 bucket policy'], a: 1, why: 'Private subnets route outbound traffic through a NAT gateway, which sits in a public subnet with an internet gateway.' },
  { c: 'AWS', q: 'Which AWS regions are isolated for US government and regulated workloads?', o: ['GovCloud (US)', 'Outposts', 'Local Zones', 'Wavelength'], a: 0, why: 'GovCloud regions are run by screened US citizens and hold authorizations like FedRAMP High. Outposts, Local Zones and Wavelength bring AWS closer to users or on-premises.' },

  { c: 'Containers', q: 'What makes containers lighter than virtual machines?', o: ['They compress their files', 'They share the host operating system\'s kernel', 'They only run on bare metal', 'They don\'t use any memory limits'], a: 1, why: 'A VM boots its own full OS; containers isolate processes on one shared kernel using namespaces and cgroups.' },
  { c: 'Containers', q: 'Why copy the dependency file and install dependencies before copying the rest of the source in a Dockerfile?', o: ['Docker requires that order', 'So code changes don\'t invalidate the cached dependency layer', 'It makes the container run as non-root', 'It exposes fewer ports'], a: 1, why: 'Each instruction is a cached layer. If source changes come after the install step, rebuilding skips the slow reinstall.' },
  { c: 'Containers', q: 'Extra arguments after the image name in docker run replace which instruction\'s value?', o: ['ENTRYPOINT', 'CMD', 'FROM', 'WORKDIR'], a: 1, why: 'CMD provides defaults that docker run arguments override. Overriding ENTRYPOINT takes the --entrypoint flag.' },
  { c: 'Containers', q: 'In Docker Compose, how should the backend service reach a database service named db?', o: ['localhost:5432', 'db:5432', '127.0.0.1:5432', 'Through a public IP'], a: 1, why: 'Compose creates a shared network where each service name is a DNS name. localhost inside a container is the container itself.' },

  { c: 'Kubernetes & OpenShift', q: 'Which Kubernetes object gives a changing set of pods one stable address and DNS name?', o: ['Deployment', 'ConfigMap', 'Service', 'ReplicaSet'], a: 2, why: 'Pods come and go with new IPs; a Service selects them by label and load-balances across whichever are ready.' },
  { c: 'Kubernetes & OpenShift', q: 'A container keeps restarting and its status says OOMKilled. What is the most likely cause?', o: ['Its readiness probe is failing', 'It used more memory than its limit', 'The image tag doesn\'t exist', 'Its CPU request is too high'], a: 1, why: 'OOMKilled means the kernel killed the process for exceeding its memory limit. Raise the limit or fix the leak.' },
  { c: 'Kubernetes & OpenShift', q: 'When a pod\'s readiness probe fails, Kubernetes:', o: ['Restarts the container', 'Deletes the Deployment', 'Stops sending it traffic from the Service', 'Adds a new node'], a: 2, why: 'Readiness controls traffic. It\'s the liveness probe that triggers restarts.' },
  { c: 'Kubernetes & OpenShift', q: 'Which control plane component stores the cluster\'s state?', o: ['kubelet', 'etcd', 'kube-proxy', 'The scheduler'], a: 1, why: 'etcd is the key-value store behind the API server. The kubelet runs pods on each node.' },
  { c: 'Kubernetes & OpenShift', q: 'Which workload runs one copy of a pod on every node, for example a log collector?', o: ['StatefulSet', 'DaemonSet', 'Job', 'HorizontalPodAutoscaler'], a: 1, why: 'A DaemonSet schedules a pod per node, including new nodes as they join.' },
  { c: 'Kubernetes & OpenShift', q: 'What does OpenShift call its built-in object for exposing a service at a public hostname?', o: ['Gateway', 'Route', 'Portal', 'Tunnel'], a: 1, why: 'OpenShift Routes predate Kubernetes Ingress and are the usual way to expose HTTP(S) services there.' },
  { c: 'Kubernetes & OpenShift', q: 'By default, the values in a Kubernetes Secret are:', o: ['Encrypted with AES everywhere', 'Base64-encoded, not encrypted, unless you enable encryption at rest', 'Hashed so nobody can read them', 'Kept only in memory'], a: 1, why: 'Base64 is encoding, not encryption. Enable etcd encryption or use an external secrets manager, and restrict access with RBAC.' },

  { c: 'CI/CD & IaC', q: 'Which deployment strategy sends a small share of traffic to the new version before rolling it out further?', o: ['Blue-green', 'Canary', 'Recreate', 'Big bang'], a: 1, why: 'Canary releases test the new version on a slice of real traffic. Blue-green switches all traffic at once.' },
  { c: 'CI/CD & IaC', q: 'What is the safest way to promote a build from dev to staging to production?', o: ['Rebuild the image in each environment', 'Deploy the same immutable image, tagged with the commit SHA, everywhere', 'Always deploy the latest tag', 'Copy files to the servers by hand'], a: 1, why: 'Promoting one immutable artifact means production runs exactly what you tested; only configuration changes per environment.' },
  { c: 'CI/CD & IaC', q: 'What does terraform plan do?', o: ['Applies the changes immediately', 'Shows what Terraform would change, without changing anything', 'Deletes the state file', 'Formats your .tf files'], a: 1, why: 'plan diffs your configuration against the state and real infrastructure; apply makes the changes.' },
  { c: 'CI/CD & IaC', q: 'In GitOps, what is the source of truth for what should run in the cluster?', o: ['The cluster itself', 'A Git repository', 'The CI server', 'The cloud console'], a: 1, why: 'An agent like Argo CD keeps syncing the cluster to what\'s in Git, so every change is a reviewed commit.' },
  { c: 'CI/CD & IaC', q: 'What does a feature flag let you do?', o: ['Skip code review', 'Turn a feature on or off without redeploying', 'Encrypt configuration', 'Run tests in parallel'], a: 1, why: 'Flags separate deploying code from releasing it, so you can roll out gradually and switch off a bad feature instantly.' },

  { c: 'Networking', q: 'How many IP addresses are in a /24 block?', o: ['24', '128', '256', '1,024'], a: 2, why: 'A /24 fixes 24 of 32 bits, leaving 8 bits for hosts: 2⁸ = 256 addresses (a few are usually reserved).' },
  { c: 'Networking', q: 'Which HTTP status means "we know who you are, but you\'re not allowed to do this"?', o: ['401', '403', '404', '409'], a: 1, why: '401 means not authenticated; 403 means authenticated but not authorized.' },
  { c: 'Networking', q: 'Which DNS record type makes one name an alias for another name?', o: ['A', 'MX', 'CNAME', 'TXT'], a: 2, why: 'CNAME points a name at another name; A records point a name at an IPv4 address.' },
  { c: 'Networking', q: 'Which statement about UDP is true?', o: ['It guarantees ordered delivery', 'It needs a handshake before sending', 'It is connectionless and doesn\'t guarantee delivery', 'It is only used for web pages'], a: 2, why: 'UDP trades reliability for low overhead, which suits DNS, video calls and games. TCP provides ordering and retransmission.' },
  { c: 'Networking', q: 'Servers in a private subnet must download updates but must not be reachable from the internet. What do you add?', o: ['A public IP on each server', 'A NAT gateway', 'A CDN', 'Another private subnet'], a: 1, why: 'A NAT gateway allows outbound connections from private subnets while blocking unsolicited inbound traffic.' },
  { c: 'Networking', q: 'What can a layer 7 load balancer do that a layer 4 one can\'t?', o: ['Balance TCP connections', 'Route requests by URL path or host name', 'Health-check a port', 'Use round robin'], a: 1, why: 'Layer 7 understands HTTP, so it can route /api to one service and everything else to another.' },

  { c: 'Security', q: 'Where should a containerized app\'s database password live?', o: ['Hard-coded in the source', 'In the Dockerfile as an ENV line', 'In a secrets manager, injected at runtime', 'In the README'], a: 2, why: 'Anything in code or images ends up in Git history and registries. Inject secrets at runtime and rotate them.' },
  { c: 'Security', q: 'Parameterized queries mainly protect against:', o: ['Cross-site scripting', 'SQL injection', 'DDoS attacks', 'Weak passwords'], a: 1, why: 'Parameters keep user input as data, so it can never be run as part of the SQL statement.' },
  { c: 'Security', q: 'Which is right for storing user passwords?', o: ['SHA-256 with no salt', 'Base64', 'bcrypt or Argon2', 'AES with a key in the code'], a: 2, why: 'Password hashing should be slow and salted so leaked hashes are expensive to crack. Base64 is just encoding.' },
  { c: 'Security', q: 'In a standard signed JWT, the payload is:', o: ['Encrypted so only the server can read it', 'Encoded, so anyone holding the token can read it', 'Hashed and unreadable', 'Never sent to the client'], a: 1, why: 'The signature stops tampering but doesn\'t hide the contents. Never put secrets in a JWT payload.' },
  { c: 'Security', q: 'What does the principle of least privilege mean?', o: ['Give admins every permission to avoid delays', 'Give each user and service only the access it needs', 'Share one service account between apps', 'Turn off logging for privacy'], a: 1, why: 'Narrow permissions limit the damage when an account or service is compromised.' },
  { c: 'Security', q: 'What does OpenID Connect add on top of OAuth 2.0?', o: ['Password hashing', 'An ID token that says who the user is', 'Encryption at rest', 'Rate limiting'], a: 1, why: 'OAuth 2.0 grants access to APIs; OIDC adds authentication, which is what single sign-on uses.' },

  { c: 'Data', q: 'Which ACID property guarantees that a committed transaction survives a crash?', o: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], a: 3, why: 'Durability means committed data is written somewhere it won\'t be lost, like a write-ahead log.' },
  { c: 'Data', q: 'Nurses can work many surgeries and surgeries need many nurses. How do you model that in SQL?', o: ['A comma-separated list of IDs in one column', 'A link table with foreign keys to both tables', 'A copy of the nurse table for each surgery', 'One big JSON column'], a: 1, why: 'A link (join) table holds one row per pairing and can carry extra columns like status or role.' },
  { c: 'Data', q: 'Adding an index to a column usually:', o: ['Speeds up both reads and writes', 'Speeds up reads that filter on it, but slows writes slightly', 'Saves storage space', 'Enforces foreign keys'], a: 1, why: 'Every insert and update must also update the index, and the index takes extra space.' },
  { c: 'Data', q: 'In SQL, what does HAVING filter?', o: ['Rows, before grouping', 'Groups, after aggregation', 'Only joined tables', 'Indexes'], a: 1, why: 'WHERE filters rows before GROUP BY; HAVING filters the grouped results, like HAVING COUNT(*) >= 3.' },
  { c: 'Data', q: 'Read traffic is overwhelming your single PostgreSQL primary. What is usually the first scaling step?', o: ['Shard the database by user', 'Add read replicas and send reads to them', 'Switch to a NoSQL database', 'Delete old indexes'], a: 1, why: 'Replicas spread read load with little application change. Sharding is far more complex and is for when writes outgrow one primary.' },

  { c: 'Reliability', q: 'An SLO of 99.9% availability allows roughly how much downtime in a 30-day month?', o: ['43 minutes', '4.3 hours', '7.2 hours', '4 minutes'], a: 0, why: '30 days is 43,200 minutes, and 0.1% of that is about 43 minutes.' },
  { c: 'Reliability', q: 'Retrying with exponential backoff and jitter helps avoid:', o: ['Cold starts', 'Many clients retrying in sync and overwhelming a recovering service', 'Memory leaks', 'DNS caching'], a: 1, why: 'Backoff spaces retries out and jitter randomizes them so clients don\'t hit the service at the same instant.' },
  { c: 'Reliability', q: 'Which signal follows a single request through every service it touches?', o: ['A metric', 'A log line', 'A trace', 'An alert'], a: 2, why: 'Distributed tracing links each hop of a request so you can see where the time went.' },
  { c: 'Reliability', q: 'Which of these is one of the four golden signals for monitoring a service?', o: ['Lines of code', 'Latency', 'Number of commits', 'Test coverage'], a: 1, why: 'The four golden signals are latency, traffic, errors and saturation.' },

  { c: 'Linux & Git', q: 'What do the permissions 640 on a file mean?', o: ['Owner read/write, group read, others nothing', 'Owner read/write/execute, group read/write, others nothing', 'Owner read, group read/write, others nothing', 'Everyone can read it'], a: 0, why: 'Each digit adds read (4), write (2) and execute (1): 6 = rw-, 4 = r--, 0 = ---.' },
  { c: 'Linux & Git', q: 'Which command shows the process listening on port 8080?', o: ['ls -la :8080', 'lsof -i :8080', 'chmod 8080', 'ping 8080'], a: 1, why: 'lsof -i :8080 (or ss -tulpn) lists the process and its PID.' },
  { c: 'Linux & Git', q: 'How should you undo a commit that is already pushed to a shared branch?', o: ['git reset --hard and force-push', 'git revert', 'Delete the branch', 'Edit the files back by hand and never commit'], a: 1, why: 'revert adds a new commit that undoes the old one without rewriting history other people already have.' },
  { c: 'Linux & Git', q: 'Which command keeps printing new lines as they are added to a log file?', o: ['cat -n app.log', 'tail -f app.log', 'head -20 app.log', 'wc -l app.log'], a: 1, why: 'tail -f follows the file. With systemd services, journalctl -f does the same.' },

  { c: 'IBM Cloud', q: 'Which IBM Cloud service runs containers, apps and batch jobs serverlessly and scales to zero?', o: ['Code Engine', 'Satellite', 'Schematics', 'Cloudant'], a: 0, why: 'Code Engine is IBM\'s managed serverless platform: give it an image or source code and it handles scaling.' },
  { c: 'IBM Cloud', q: 'Which service lets you run IBM Cloud services in your own data center while managing them from IBM Cloud?', o: ['IBM Cloud Satellite', 'IBM Cloud Schematics', 'Event Streams', 'Code Engine'], a: 0, why: 'Satellite extends IBM Cloud to on-prem, edge and other clouds, which is IBM\'s hybrid strategy in product form.' },
  { c: 'IBM Cloud', q: 'What is IBM Event Streams?', o: ['A video service', 'Managed Apache Kafka', 'A NoSQL database', 'A CI/CD tool'], a: 1, why: 'Event Streams is IBM\'s managed Kafka for event-driven and streaming workloads.' },
  { c: 'IBM Cloud', q: 'An application needs to call IBM Cloud APIs. It should authenticate with:', o: ['Your personal login and password', 'A service ID with its own API key', 'A shared admin account', 'No credentials, since it runs inside IBM Cloud'], a: 1, why: 'Service IDs give apps their own identity with narrowly scoped IAM policies, and their API keys can be rotated.' },

  { c: 'CS fundamentals', q: 'Threads in the same process:', o: ['Each get their own memory space', 'Share the process\'s memory', 'Can never run at the same time', 'Must be written in C'], a: 1, why: 'Shared memory makes threads cheap but means shared data needs locks or other synchronization.' },
  { c: 'CS fundamentals', q: 'What is the average time to look up a key in a hash table?', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], a: 0, why: 'Hashing jumps straight to a bucket. Worst case is O(n) with heavy collisions.' },
  { c: 'CS fundamentals', q: 'Binary search over 1,000,000 sorted items needs at most about how many comparisons?', o: ['20', '1,000', '500,000', '1,000,000'], a: 0, why: 'Each comparison halves the range, and 2²⁰ is just over a million.' },
  { c: 'CS fundamentals', q: 'Two threads each hold a lock and wait for the other\'s lock forever. What is this?', o: ['A race condition', 'A deadlock', 'A memory leak', 'Starvation'], a: 1, why: 'Prevent deadlocks by always acquiring locks in the same order or using timeouts.' },

  { c: 'Microservices & APIs', q: 'A client retries POST /payments after a timeout and the customer is charged twice. What is the standard fix?', o: ['Use GET instead of POST', 'Send an idempotency key that the server uses to ignore duplicates', 'Turn off retries everywhere', 'Raise the timeout to five minutes'], a: 1, why: 'With an idempotency key, the server returns the original result for a repeated request instead of processing it again.' },
  { c: 'Microservices & APIs', q: 'Which API style lets the client request exactly the fields it needs from a single endpoint?', o: ['REST', 'GraphQL', 'SOAP', 'gRPC'], a: 1, why: 'GraphQL clients send a query naming the fields they want. REST returns fixed resource shapes from many endpoints.' },
  { c: 'Microservices & APIs', q: 'What is the saga pattern used for?', o: ['Caching static files', 'Keeping data consistent across services with local transactions and compensating steps', 'Load balancing', 'Encrypting service-to-service traffic'], a: 1, why: 'Without one database transaction across services, a saga chains local transactions and undoes earlier steps if a later one fails.' },
  { c: 'Microservices & APIs', q: 'What does an API gateway usually handle?', o: ['Database migrations', 'Routing, authentication and rate limiting at a single entry point', 'Building container images', 'Storing secrets'], a: 1, why: 'The gateway gives clients one front door and takes cross-cutting concerns out of each service.' },
];
