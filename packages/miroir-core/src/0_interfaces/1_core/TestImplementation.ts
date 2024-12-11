
export interface TestImplementationExpect {
  toEqual(value: any): boolean;
}

/**
 * Interface for the test implementation
 */
export interface TestImplementation {
  expect(value: any): TestImplementationExpect;
}