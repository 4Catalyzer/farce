import dirtyChai from 'dirty-chai';

global.chai.use(dirtyChai);

const testsContext = require.context('.', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);

beforeEach(() => {
  /* eslint-disable no-console */
  sinon.stub(console, 'warn').callsFake((message) => {
    let expected = false;

    console.warn.expected.forEach((about) => {
      if (message.includes(about)) {
        console.warn.warned[about] = true;
        expected = true;
      }
    });

    if (expected) {
      return;
    }

    console.warn.threw = true;
    throw new Error(message);
  });

  console.warn.expected = [];
  console.warn.warned = Object.create(null);
  console.warn.threw = false;
  /* eslint-enable no-console */
});

afterEach(() => {
  /* eslint-disable no-console */
  const { expected, warned, threw } = console.warn;
  console.warn.restore();

  if (!threw && expected.length) {
    expect(warned).to.have.keys(expected);
  }
  /* eslint-enable no-console */
});
