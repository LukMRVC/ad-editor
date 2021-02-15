import { UnslugifyPipe } from './unslugify.pipe';

describe('UnslugifyPipe', () => {
  it('create an instance', () => {
    const pipe = new UnslugifyPipe();
    expect(pipe).toBeTruthy();
  });

  it('transforms correcly', () => {
    const pipe = new UnslugifyPipe();
    expect(pipe.transform('some-val')).toBe('some val');
  });
});
