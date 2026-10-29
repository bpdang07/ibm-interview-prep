// Glassdoor tab: what IBM Cloud Developer candidates reported, paraphrased from
// Glassdoor's interview reviews, plus practice material for each thing they mention.
// reported: stage, where, q, how (HTML), go = [kind, target, label]
//   kind 'tab' links to a tab, 'jump' scrolls to an id on this page,
//   'screen' opens that question in the one-way video practice, 'chal' opens an Assess challenge.

PREP.glassdoor = {
  source: 'https://www.glassdoor.com/Interview/IBM-Cloud-Developer-Interview-Questions-EI_IE354.0,3_KO4,19.htm',

  reported: [
    {
      stage: 'Recruiter call', where: 'Bengaluru · 2023', q: 'Why do you want to make a change?',
      how: 'For you this means "why this role, and why now?" Keep it forward-looking: you want to work closer to cloud infrastructure and production systems. Never criticize your current team.',
      go: ['screen', 2, 'Practice on camera'],
    },
    {
      stage: 'Technical', where: 'Bengaluru · 2023', q: 'Scenario questions about the technologies on your résumé',
      how: '"What would you do if…" about tools you listed. Answer in the same order every time: clarify what\'s happening, limit the damage (roll back, scale up, fail over), find the cause in logs and metrics, fix it, then say how you\'d stop it happening again.',
      go: ['tab', 'design', 'Design scenarios'],
    },
    {
      stage: 'Technical', where: 'Bengaluru · 2023', q: 'Write a few programs in the language the job asks for',
      how: 'Check the posting for the language. If it says Python, or doesn\'t say, use Python and know its standard tools cold: <code>dict</code> and <code>set</code>, <code>Counter</code> and <code>deque</code>, <code>sorted(key=…)</code>, string methods and list comprehensions.',
      go: ['tab', 'assess', 'Assess challenges'],
    },
    {
      stage: 'Manager', where: 'Bengaluru · 2023', q: 'Why IBM?',
      how: 'Three reasons, the last one specific to this team. Hybrid cloud matches your AWS and Google Cloud experience, and regulated work matches VetsEZ.',
      go: ['tab', 'talk', 'Your Why IBM'],
    },
    {
      stage: 'Every round', where: 'Bengaluru · 2023', q: 'Do you have any questions about the role?',
      how: 'That reviewer said the interviewers were glad to talk about the role, the culture, the project they\'d join and where IBM\'s business is heading. Have a question ready for each.',
      go: ['tab', 'talk', 'Questions to ask'],
    },
    {
      stage: 'Technical', where: 'Bengaluru · 2022 · campus', q: 'Computer networks, databases and operating systems',
      how: 'Classic CS-degree questions: OSI layers, TCP vs UDP, ACID, normalization, joins, process vs thread, deadlocks, virtual memory. Give a short, exact definition and one example.',
      go: ['jump', 'gdFund', 'Rapid-fire below'],
    },
    {
      stage: 'Technical', where: 'Bengaluru · 2022 · campus', q: 'A few SQL queries to write on the spot',
      how: 'This reviewer couldn\'t solve them, so practice until they\'re automatic: JOIN, GROUP BY with HAVING, a self join, LEFT JOIN to find missing rows, and a window function for "top N in each group."',
      go: ['jump', 'gdSql', 'SQL drills below'],
    },
    {
      stage: 'Technical', where: 'Bengaluru · 2022 · campus', q: 'Find the largest binary search tree inside a binary tree',
      how: 'A depth-first walk where every node reports to its parent whether it\'s a BST, how big it is, and its smallest and largest value. A parent is a BST only if both children are and left max &lt; its value &lt; right min. O(n).',
      go: ['chal', 'largest-bst', 'Solve it on Assess'],
    },
    {
      stage: 'Manager', where: 'San Jose · 2019 · referral', q: 'Explain the work you did on a particular project',
      how: 'Say what <em>you</em> built, not the team: the problem, your part, one technical decision and why you made it, the result, and what you\'d change now.',
      go: ['tab', 'projects', 'Project walkthroughs'],
    },
    {
      stage: 'Technical', where: 'San Jose · 2019 · referral', q: 'Coding questions in front of several developers',
      how: 'Expect a panel, not one person. Explain your approach before you type, write it, then walk an example through it out loud. Silence reads worse than a wrong first idea.',
      go: ['tab', 'mock', 'Mock: Coding mode'],
    },
    {
      stage: 'Interview', where: 'Riyadh · 2019', q: 'Present yourself, then talk about your passions and what you\'d like to work on at IBM',
      how: 'Have a real answer to "what are you passionate about?" that connects to the job, like building things people use and owning them all the way to production. Mention hobbies briefly; they\'re a chance to be memorable.',
      go: ['screen', 3, 'Practice on camera'],
    },
    {
      stage: 'Technical', where: 'Cloud Software Developer · 2021', q: 'Write a simple application, then containerize it',
      how: 'A small API, a Dockerfile, and the commands to build and run it. Know why every line of the Dockerfile is there, and how you\'d get the image to the cloud.',
      go: ['jump', 'gdDocker', 'Worked example below'],
    },
    {
      stage: 'Behavioral', where: 'Cloud Software Developer · 2021', q: 'A situational question: "How would you respond if…"',
      how: 'For things that happened, use STAR. For hypotheticals, say what you\'d do first, who you\'d tell, and how you\'d follow up. Client trust is one of IBM\'s values, so bring the client into the answer.',
      go: ['screen', 8, 'Practice on camera'],
    },
  ],

  // One-way video questions: [question, what a good answer hits]
  screen: [
    ['Tell me about yourself.', 'Present → past → why this role. Aim for 60–90 seconds even when you have 3 minutes.'],
    ['Why do you want to work at IBM?', 'Hybrid cloud matches your AWS and Google Cloud experience, and regulated work matches VetsEZ. Finish with something specific to this team.'],
    ['Why are you looking to make a change now?', 'Forward-looking: you want to work closer to cloud infrastructure and production systems. Never criticize your current team.'],
    ['What are you passionate about working on?', 'Tie it to the job: building things people actually use and owning them all the way to production. One concrete example.'],
    ['Tell me about a time you worked with a team to meet a tight deadline.', 'STAR. Spend most of it on what you did: how the work was split, what you cut, and how you kept everyone in sync.'],
    ['Tell me about a time you had to learn a new technology quickly.', 'Railpark: game dev → deploying on Google Cloud. Explain how you learn: docs, a tiny prototype, then the real thing.'],
    ['Describe a time you disagreed with a teammate. What did you do?', 'Disagree about the work, not the person. Show you listened, used evidence, and committed once the team decided.'],
    ['Tell me about a time something you built didn\'t work. What did you do next?', 'Own it. Symptom → how you found the cause → the fix → what you changed so it can\'t happen again.'],
    ['How would you respond if a client was unhappy with something your team delivered?', 'Listen first and restate the problem. Own your part, give a concrete next step with a date, then follow up when you said you would.'],
    ['How do you handle a task you don\'t know how to do yet?', 'Break it down, research, try a small version, and ask for help early with a specific question rather than "I\'m stuck."'],
    ['What\'s something technical you learned recently?', 'Something real and recent: why you learned it, and what you built or changed with it.'],
    ['Where do you see yourself in three to five years?', 'Growing into a strong cloud engineer here: owning services end to end, earning a certification or two, helping newer hires.'],
  ],

  fundamentals: [
    {
      topic: 'Computer networks', items: [
        ['What are the layers of the OSI model?', 'Seven, bottom to top: Physical, Data link, Network, Transport, Session, Presentation, Application ("Please Do Not Throw Sausage Pizza Away"). Day to day people use the four-layer TCP/IP model: link, internet (IP), transport (TCP/UDP), application (HTTP, DNS).'],
        ['TCP vs UDP?', 'TCP opens a connection and guarantees delivery and order, resending lost packets: web pages, APIs, databases. UDP just sends packets with no guarantees, so it\'s faster: video calls, games, DNS lookups.'],
        ['What happens when you type a URL and press Enter?', 'DNS turns the name into an IP address. The browser opens a TCP connection, plus a TLS handshake for HTTPS, and sends an HTTP request. The server, often behind a load balancer, responds, and the browser renders the HTML and fetches its CSS, JavaScript and images.'],
        ['HTTP vs HTTPS?', 'HTTPS is HTTP inside TLS: the connection is encrypted, and the server proves who it is with a certificate. The default ports are 80 and 443.'],
        ['What does the /24 in 10.0.1.0/24 mean?', 'The first 24 bits are the network, leaving 8 bits for hosts: 256 addresses, 10.0.1.0 to 10.0.1.255. Cloud subnets are written this way.'],
      ],
    },
    {
      topic: 'Databases', items: [
        ['What does ACID mean?', 'Atomicity: all of a transaction happens or none of it. Consistency: rules like foreign keys always hold. Isolation: transactions running at once don\'t see each other\'s half-done work. Durability: once committed, it survives a crash.'],
        ['What is normalization? 1NF, 2NF, 3NF?', 'Organizing tables so each fact is stored once. 1NF: one value per cell, no repeating groups. 2NF: every column depends on the whole primary key. 3NF: no column depends on another non-key column. Sometimes you denormalize on purpose to make reads faster.'],
        ['Primary key vs foreign key?', 'A primary key uniquely identifies each row in its table. A foreign key is a column that points at another table\'s primary key, and the database rejects rows that point at nothing.'],
        ['INNER JOIN vs LEFT JOIN?', 'INNER JOIN keeps only rows that match in both tables. LEFT JOIN keeps every row from the left table, with NULLs where the right side has no match. That\'s how you find "departments with no employees."'],
        ['What does an index cost you?', 'Reads on the indexed columns get much faster, but it takes extra storage and slows inserts and updates, because every write also has to update the index.'],
      ],
    },
    {
      topic: 'Operating systems', items: [
        ['Process vs thread?', 'A process is a running program with its own memory. Threads run inside a process and share its memory, so they\'re cheaper to create but can corrupt shared data without locks.'],
        ['What is a deadlock, and what causes one?', 'Two or more threads each waiting forever for a lock another one holds. It needs all four conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Break one, usually by always taking locks in the same order or by using timeouts.'],
        ['Mutex vs semaphore?', 'A mutex lets one thread in at a time, and only the thread that locked it can unlock it. A semaphore is a counter that lets up to N in, like a pool of 10 database connections.'],
        ['What is virtual memory?', 'Each process sees its own large, private address space. The OS maps it in pages onto physical RAM and moves rarely used pages to disk. A page fault is when a program touches a page that isn\'t in RAM yet.'],
        ['How does the OS decide what runs next?', 'The scheduler. Common policies: first come first served, shortest job first, priority, and round robin, where each process gets a time slice in turn. Switching between processes is a context switch, and it has a cost.'],
      ],
    },
  ],

  sql: {
    schema: 'employees(id, name, email, dept_id, salary, manager_id)\ndepartments(id, name)',
    items: [
      ['Second-highest salary', `SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);`, 'Returns NULL when there\'s no second salary. Another way: SELECT DISTINCT salary … ORDER BY salary DESC LIMIT 1 OFFSET 1.'],
      ['Departments with more than 5 people, and their average salary', `SELECT d.name, COUNT(*) AS headcount, AVG(e.salary) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.dept_id
GROUP BY d.name
HAVING COUNT(*) > 5;`, 'WHERE filters rows before grouping; HAVING filters the groups after.'],
      ['Employees who earn more than their manager', `SELECT e.name
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;`, 'A self join: the same table twice, under two aliases.'],
      ['Emails that appear more than once', `SELECT email, COUNT(*) AS copies
FROM employees
GROUP BY email
HAVING COUNT(*) > 1;`, 'The standard duplicate check. To delete the extras, keep the row with the lowest id in each group.'],
      ['Departments with no employees', `SELECT d.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
WHERE e.id IS NULL;`, 'LEFT JOIN keeps every department; the ones with no match have NULL on the employee side.'],
      ['Highest-paid employee in each department', `SELECT name, dept_id, salary
FROM (
  SELECT name, dept_id, salary,
         RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
  FROM employees
) ranked
WHERE r = 1;`, 'A window function. RANK keeps ties; ROW_NUMBER picks exactly one. Use r <= 3 for the top three. This works the same in Snowflake.'],
    ],
  },
};
