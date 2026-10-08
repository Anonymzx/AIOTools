/**
 * Pure shunting-yard math expression evaluator.
 *
 * Supports: numbers (incl. decimals + scientific notation), binary operators
 * `+ - * / ^ %`, parentheses, unary minus, functions
 * sin/cos/tan/asin/acos/atan/sqrt/ln/log(abs base-10)/abs/exp,
 * constants `pi` / `e`, and variables (e.g. `x` for the graph plotter).
 *
 * No DOM, no Math.random, no side effects — safe to unit test in Node.
 */

export type AngleMode = "deg" | "rad";

export interface EvalOptions {
  angle?: AngleMode;
  vars?: Record<string, number>;
}

type Token =
  | { kind: "num"; value: number }
  | { kind: "op"; value: string }
  | { kind: "func"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "comma" };

const FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sqrt",
  "ln",
  "log",
  "abs",
  "exp",
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "%": 2,
  "^": 3,
  "u-": 4,
};

function isRightAssoc(op: string): boolean {
  return op === "^" || op === "u-";
}

function tokenize(input: string, vars: Record<string, number>): Token[] {
  const tokens: Token[] = [];
  const s = input.trim().replace(/,/g, ",");
  let i = 0;
  let prev: Token | null = null;

  const pushOp = (op: string): void => {
    // Detect unary minus: at start, after another operator, after lparen, or after comma.
    if (op === "-") {
      if (
        prev === null ||
        prev.kind === "op" ||
        prev.kind === "lparen" ||
        prev.kind === "comma"
      ) {
        tokens.push({ kind: "op", value: "u-" });
        prev = tokens[tokens.length - 1] as Token;
        return;
      }
    }
    if (op === "+") {
      // Unary plus: no-op, just skip.
      if (
        prev === null ||
        prev.kind === "op" ||
        prev.kind === "lparen" ||
        prev.kind === "comma"
      ) {
        return;
      }
    }
    tokens.push({ kind: "op", value: op });
    prev = tokens[tokens.length - 1] as Token;
  };

  while (i < s.length) {
    const ch = s[i] as string;
    if (ch === " " || ch === "\t" || ch === "\n") {
      i += 1;
      continue;
    }
    // Number: digits with optional decimal + exponent.
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      const m = /^(\d*\.?\d+(?:[eE][+-]?\d+)?)/.exec(s.slice(i));
      if (!m || m[1] === ".") throw new Error("Unexpected token '.'");
      const value = Number(m[1]);
      if (!Number.isFinite(value)) throw new Error(`Invalid number '${m[1]}'`);
      tokens.push({ kind: "num", value });
      prev = tokens[tokens.length - 1] as Token;
      i += (m[1] as string).length;
      continue;
    }
    // Identifier: function, constant, or variable.
    if (
      (ch >= "a" && ch <= "z") ||
      (ch >= "A" && ch <= "Z") ||
      ch === "_"
    ) {
      const m = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(s.slice(i));
      const name = (m as RegExpMatchArray)[0].toLowerCase();
      i += (m as RegExpMatchArray)[0].length;
      if (FUNCTIONS.has(name)) {
        tokens.push({ kind: "func", value: name });
        prev = tokens[tokens.length - 1] as Token;
      } else if (name in CONSTANTS) {
        tokens.push({ kind: "num", value: CONSTANTS[name] as number });
        prev = tokens[tokens.length - 1] as Token;
      } else if (name in vars) {
        const v = vars[name];
        if (!Number.isFinite(v)) throw new Error(`Variable '${name}' is not finite`);
        tokens.push({ kind: "num", value: v });
        prev = tokens[tokens.length - 1] as Token;
      } else {
        throw new Error(`Unknown name '${name}'`);
      }
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen" });
      prev = tokens[tokens.length - 1] as Token;
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen" });
      prev = tokens[tokens.length - 1] as Token;
      i += 1;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma" });
      prev = tokens[tokens.length - 1] as Token;
      i += 1;
      continue;
    }
    if ("+-*/^%".includes(ch)) {
      pushOp(ch);
      i += 1;
      continue;
    }
    throw new Error(`Unexpected token '${ch}'`);
  }
  return insertImplicitMultiplication(tokens);
}

/** Insert `*` for cases like `2pi`, `2x`, `2sin(x)`, `)(`, `2(3+4)`. */
function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let k = 0; k < tokens.length; k += 1) {
    const cur = tokens[k] as Token;
    out.push(cur);
    const nxt = tokens[k + 1] as Token | undefined;
    if (!nxt) continue;
    const leftIsValue =
      cur.kind === "num" || cur.kind === "rparen";
    const rightIsValue =
      nxt.kind === "num" ||
      nxt.kind === "func" ||
      nxt.kind === "lparen";
    if (leftIsValue && rightIsValue) {
      out.push({ kind: "op", value: "*" });
    }
  }
  return out;
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  for (const tok of tokens) {
    if (tok.kind === "num") {
      output.push(tok);
    } else if (tok.kind === "func") {
      stack.push(tok);
    } else if (tok.kind === "comma") {
      let found = false;
      while (stack.length > 0) {
        const top = stack[stack.length - 1] as Token;
        if (top.kind === "lparen") {
          found = true;
          break;
        }
        output.push(stack.pop() as Token);
      }
      if (!found) throw new Error("Misplaced comma");
    } else if (tok.kind === "op") {
      while (stack.length > 0) {
        const top = stack[stack.length - 1] as Token;
        if (top.kind !== "op") break;
        const pTop = PRECEDENCE[top.value] as number;
        const pCur = PRECEDENCE[tok.value] as number;
        if (pTop > pCur || (pTop === pCur && !isRightAssoc(tok.value))) {
          output.push(stack.pop() as Token);
        } else {
          break;
        }
      }
      stack.push(tok);
    } else if (tok.kind === "lparen") {
      stack.push(tok);
    } else if (tok.kind === "rparen") {
      let found = false;
      while (stack.length > 0) {
        const top = stack.pop() as Token;
        if (top.kind === "lparen") {
          found = true;
          break;
        }
        output.push(top);
      }
      if (!found) throw new Error("Mismatched parentheses");
      const top = stack[stack.length - 1] as Token | undefined;
      if (top && top.kind === "func") {
        output.push(stack.pop() as Token);
      }
    }
  }
  while (stack.length > 0) {
    const top = stack.pop() as Token;
    if (top.kind === "lparen" || top.kind === "rparen") {
      throw new Error("Mismatched parentheses");
    }
    output.push(top);
  }
  return output;
}

function applyFunc(name: string, arg: number, angle: AngleMode): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const toDeg = (r: number): number => (r * 180) / Math.PI;
  switch (name) {
    case "sin":
      return Math.sin(angle === "deg" ? toRad(arg) : arg);
    case "cos":
      return Math.cos(angle === "deg" ? toRad(arg) : arg);
    case "tan": {
      const v = Math.tan(angle === "deg" ? toRad(arg) : arg);
      if (!Number.isFinite(v) || Math.abs(v) > 1e15) throw new Error("Domain error in tan");
      return v;
    }
    case "asin": {
      if (arg < -1 || arg > 1) throw new Error("Domain error in asin");
      const v = Math.asin(arg);
      return angle === "deg" ? toDeg(v) : v;
    }
    case "acos": {
      if (arg < -1 || arg > 1) throw new Error("Domain error in acos");
      const v = Math.acos(arg);
      return angle === "deg" ? toDeg(v) : v;
    }
    case "atan": {
      const v = Math.atan(arg);
      return angle === "deg" ? toDeg(v) : v;
    }
    case "sqrt":
      if (arg < 0) throw new Error("Domain error in sqrt");
      return Math.sqrt(arg);
    case "ln":
      if (arg <= 0) throw new Error("Domain error in ln");
      return Math.log(arg);
    case "log":
      if (arg <= 0) throw new Error("Domain error in log");
      return Math.log10(arg);
    case "abs":
      return Math.abs(arg);
    case "exp": {
      const v = Math.exp(arg);
      if (!Number.isFinite(v)) throw new Error("Overflow in exp");
      return v;
    }
    default:
      throw new Error(`Unknown function '${name}'`);
  }
}

function evalRpn(rpn: Token[], angle: AngleMode): number {
  const stack: number[] = [];
  for (const tok of rpn) {
    if (tok.kind === "num") {
      stack.push(tok.value);
    } else if (tok.kind === "op" && tok.value === "u-") {
      if (stack.length < 1) throw new Error("Invalid expression");
      stack.push(-(stack.pop() as number));
    } else if (tok.kind === "op") {
      if (stack.length < 2) throw new Error("Invalid expression");
      const b = stack.pop() as number;
      const a = stack.pop() as number;
      if (tok.value === "+") stack.push(a + b);
      else if (tok.value === "-") stack.push(a - b);
      else if (tok.value === "*") stack.push(a * b);
      else if (tok.value === "/") {
        if (b === 0) throw new Error("Division by zero");
        stack.push(a / b);
      } else if (tok.value === "%") {
        if (b === 0) throw new Error("Division by zero");
        stack.push(a % b);
      } else if (tok.value === "^") {
        const v = Math.pow(a, b);
        if (!Number.isFinite(v)) throw new Error("Overflow in power");
        if (Number.isNaN(v)) throw new Error("Domain error in power");
        stack.push(v);
      }
    } else if (tok.kind === "func") {
      if (stack.length < 1) throw new Error(`Function '${tok.value}' needs an argument`);
      stack.push(applyFunc(tok.value, stack.pop() as number, angle));
    } else {
      throw new Error("Invalid expression");
    }
  }
  if (stack.length !== 1) throw new Error("Invalid expression");
  const result = stack[0] as number;
  if (!Number.isFinite(result)) throw new Error("Result is not finite");
  if (Number.isNaN(result)) throw new Error("Result is undefined");
  return result;
}

/**
 * Evaluate a math expression string and return the numeric result.
 * Throws an Error with a human-readable message on any failure.
 */
export function evaluateExpression(
  input: string,
  opts: EvalOptions = {},
): number {
  const angle: AngleMode = opts.angle ?? "rad";
  const vars = opts.vars ?? {};
  if (input.trim() === "") throw new Error("Empty expression");
  const tokens = tokenize(input, vars);
  if (tokens.length === 0) throw new Error("Empty expression");
  return evalRpn(toRpn(tokens), angle);
}

/** Format a result for display: trims float noise, avoids long tails. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Result is not finite");
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-9) {
    return value.toExponential(6).replace(/(\.\d*?)0+e/, "$1e");
  }
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}
