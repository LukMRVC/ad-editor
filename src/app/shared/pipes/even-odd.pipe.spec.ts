import { EvenOddPipe } from './even-odd.pipe';

describe('EvenOddPipe', () => {
  it('create an instance', () => {
    const pipe = new EvenOddPipe();
    expect(pipe).toBeTruthy();
  });
});
