// Plain-word explanations of Python errors, shown under the real message.
// Written for someone in their first weeks of Python.

interface Rule {
  test: RegExp
  explain: (m: RegExpMatchArray) => string
}

const RULES: Rule[] = [
  { test: /^Timeout/, explain: () => 'The code ran for too long and was stopped. Look for a loop that never ends.' },
  {
    test: /^NameError: name '(.+?)' is not defined(?:\. Did you mean: '(.+?)'\?)?/,
    explain: (m) =>
      m[2]
        ? `You used the name ${m[1]}, which does not exist. Did you mean ${m[2]}?`
        : `You used the name ${m[1]}, which does not exist yet. Check the spelling, or make it before this line. If it is text, it needs quotes.`,
  },
  {
    test: /^SyntaxError: unterminated string literal/,
    explain: () => 'A piece of text is missing its closing quote.',
  },
  { test: /^SyntaxError: '(.)' was never closed/, explain: (m) => `A ${m[1]} was opened but never closed.` },
  { test: /^SyntaxError: unmatched '(.)'/, explain: (m) => `There is a ${m[1]} with no matching opening bracket.` },
  {
    test: /^SyntaxError: invalid syntax\. Maybe you meant '==' or ':=' instead of '='\?/,
    explain: () => 'In a test, use == to compare. A single = stores a value and cannot be used in an if.',
  },
  { test: /^SyntaxError: 'elif' block follows an 'else' block/, explain: () => 'else must be the last part. Move the elif above the else.' },
  {
    test: /^SyntaxError: name capture '(.+?)' makes remaining patterns unreachable/,
    explain: (m) => `A plain name like ${m[1]} in a case matches anything, so the cases below it can never run. Compare with a value in quotes or a number, or use case _: last.`,
  },
  { test: /^SyntaxError: '(break|continue)' outside loop/, explain: (m) => `${m[1]} only works inside a for or while loop. Check its indentation.` },
  { test: /^SyntaxError: expected ':'/, explain: () => 'This line needs a colon : at the end.' },
  { test: /^SyntaxError: invalid decimal literal/, explain: () => 'A name cannot start with a digit, and numbers cannot have letters in them.' },
  {
    test: /^SyntaxError: cannot assign to/,
    explain: () => 'The left side of = must be a plain name. Names cannot contain spaces or dashes.',
  },
  { test: /^SyntaxError: invalid syntax\. Perhaps you forgot a comma\?/, explain: () => 'Two values are next to each other. Did you forget a comma between them?' },
  { test: /^SyntaxError/, explain: () => 'Python could not read this line. Check for a missing quote, bracket, comma or colon.' },
  { test: /^IndentationError: unexpected indent/, explain: () => 'This line starts with spaces it should not have.' },
  { test: /^IndentationError: expected an indented block/, explain: () => 'The line after a colon must be indented by 4 spaces.' },
  { test: /^IndentationError/, explain: () => 'The spaces at the start of a line do not line up with the lines around it.' },
  {
    test: /^TypeError: can only concatenate str \(not "(.+?)"\) to str/,
    explain: (m) => `You tried to join text with + to a ${m[1]}. Turn it into text first with str(), or use a comma in print.`,
  },
  {
    test: /^TypeError: unsupported operand type\(s\) for (.+?): '(.+?)' and '(.+?)'/,
    explain: (m) => `${m[1]} does not work between a ${m[2]} and a ${m[3]}.`,
  },
  {
    test: /^TypeError: can't multiply sequence by non-int of type '(.+?)'/,
    explain: (m) => `Text can only be repeated with * by a whole number, not by a ${m[1]}. Convert it with int() first.`,
  },
  { test: /^TypeError: object of type 'NoneType' has no len\(\)/, explain: () => 'This name holds None, not a list. Did you store the result of append() or sort()? They change the list and give back None.' },
  { test: /^TypeError: object of type '(.+?)' has no len\(\)/, explain: (m) => `len() counts the items in text or a list. A ${m[1]} has no length.` },
  {
    test: /^TypeError: '(.+?)' not supported between instances of '(.+?)' and '(.+?)'/,
    explain: (m) => `${m[1]} cannot compare a ${m[2]} with a ${m[3]}. Convert one of them first, for example with int().`,
  },
  { test: /^TypeError: '(.+?)' object is not iterable/, explain: (m) => `A for loop needs something with items to step through, like text or range(). A ${m[1]} has no items. Did you mean range(...)?` },
  { test: /^TypeError: 'float' object cannot be interpreted as an integer/, explain: () => 'range() only takes whole numbers. Use int() or // to get a whole number.' },
  {
    test: /^TypeError: (string|list|tuple) indices must be integers(?: or slices)?, not '?([^']+)'?/,
    explain: (m) =>
      m[2] === 'tuple'
        ? 'Inside [ ] a comma makes a pair of numbers. For a slice, use a colon: [0:3].'
        : `A position in a ${m[1]} must be a whole number, not a ${m[2]}. If it came from /, use // instead.`,
  },
  { test: /^TypeError: 'in <string>' requires string as left operand, not (\w+)/, explain: (m) => `in on text looks for text, but this is a ${m[1] === 'int' ? 'whole number' : m[1]}. Put it in quotes, or turn it into text with str().` },
  { test: /^TypeError: '(.+?)' object does not support item assignment/, explain: (m) => `A ${m[1]} can never be changed. Make a new one instead, for example with a method or with slices and +.` },
  { test: /^TypeError: '(.+?)' object is not callable/, explain: (m) => `You put ( ) after something that is a ${m[1]}, not a function.` },
  { test: /^TypeError: can only concatenate list \(not "(.+?)"\) to list/, explain: (m) => `+ joins a list to another list, not to a ${m[1]}. Put the value in brackets, like [x], or use append(x).` },
  { test: /^TypeError: sequence item (\d+): expected str instance, (.+?) found/, explain: (m) => `join() only joins text. Item ${m[1]} is not text (its type is ${m[2]}), so turn each item into text with str() first.` },
  { test: /^TypeError/, explain: () => 'A value of the wrong type was used here.' },
  { test: /^ZeroDivisionError/, explain: () => 'You divided by zero, which has no answer.' },
  { test: /^ValueError: Unknown format code '(.)' for object of type '(.+?)'/, explain: (m) => `The format :${m[1]} does not work on a ${m[2]}. Check that the value is a number, or convert it with float() first.` },
  { test: /^ValueError: invalid literal for int\(\)/, explain: () => 'int() can only turn text made of digits into a number.' },
  { test: /^ValueError: could not convert string to float/, explain: () => 'float() can only turn text that looks like a number (such as 3.5) into a number.' },
  { test: /^ValueError: list\.(remove|index)\(x\): x not in list/, explain: (m) => `${m[1]}() looks for that value, and it is not in the list. Check with in first.` },
  { test: /^ValueError: (max|min)\(\) iterable argument is empty/, explain: (m) => `${m[1]}() needs at least one item, but the list is empty.` },
  { test: /^ValueError: empty separator/, explain: () => 'split() needs something to cut at, and "" is empty. Use split() with nothing inside to cut at spaces.' },
  { test: /^ValueError/, explain: () => 'The type is right, but the value cannot be used here.' },
  { test: /^IndexError: pop from empty list/, explain: () => 'The list is empty, so there is nothing to pop.' },
  { test: /^IndexError: pop index out of range/, explain: () => 'pop(i) needs a position that exists in the list. Positions start at 0.' },
  { test: /^IndexError: list assignment index out of range/, explain: () => 'You can only change a position that already exists. To add a new item at the end, use append().' },
  { test: /^IndexError/, explain: () => 'You asked for a position that does not exist. Positions start at 0.' },
  { test: /^KeyError: (.+)/, explain: (m) => `The dictionary has no key ${m[1]}.` },
  {
    test: /^AttributeError: 'NoneType' object has no attribute '(.+?)'/,
    explain: (m) => `This name holds None, not a list, so it has no ${m[1]}. Did you store the result of append() or sort()? They change the list and give back None.`,
  },
  { test: /^AttributeError: '(.+?)' object has no attribute '(.+?)'/, explain: (m) => `A ${m[1]} has no ${m[2]}.` },
  {
    test: /^EOFError/,
    explain: () => 'input() asked for an answer, but there were no typed answers left. Add one more line in the typed answers box.',
  },
  {
    test: /^OSError: \[Errno 29\]/,
    explain: () => 'input() cannot be used in these exercises. Put the value in a variable instead.',
  },
]

export function explainPythonError(message: string): string | null {
  for (const r of RULES) {
    const m = message.match(r.test)
    if (m) return r.explain(m)
  }
  return null
}
