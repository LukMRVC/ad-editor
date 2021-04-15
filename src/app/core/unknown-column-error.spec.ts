import { UnknownColumnError } from './unknown-column-error';

describe('UnknownColumnError', () => {
  it('should create an instance', () => {
    expect(new UnknownColumnError()).toBeTruthy();
  });
});
