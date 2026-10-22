declare module 'allure-commandline' {
  import type { ChildProcess } from 'node:child_process';
  export default function allure(args: string[]): ChildProcess;
}
