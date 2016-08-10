import createTestHelpers from '../createTestHelpers';
const {expectTransform} = createTestHelpers(['split-declaration']);

describe('Split Declaration', () => {
  describe('with only uninitialized variables', () => {
    it('should split into separate declarations', () => {
      expectTransform(
        'var x,y;'
      ).toReturn(
        'var x;\nvar y;'
      );
    });
  });

  describe('with uninitialized and initialized variables', () => {
    it('should split into separate declarations', () => {
      expectTransform(
        'var x,y=100;'
      ).toReturn(
        'var x;\nvar y=100;'
      );
    });
  });

  describe('with various type of declarations', () => {
    it('should split into separate declarations', () => {
      expectTransform(
        'var x,y=100;let a,b=123;const c=12,d=234'
      ).toReturn(
        'var x;\nvar y=100;\nlet a;\nlet b=123;\nconst c=12;\nconst d=234;'
      );
    });
  });

  describe('with inline comment', () => {
    it('should split into separate declarations', () => {
      expectTransform(
        'var x,y=100;// hello'
      ).toReturn(
        'var x;// hello\nvar y=100;'
      );
    });
  });

  describe('with block comment', () => {
    it('should split into separate declarations(comment before declaration)', () => {
      expectTransform(
        '/* hello */var x,y=100;'
      ).toReturn(
        '/* hello */var x;\nvar y=100;'
      );
    });

    it('should split into separate declarations(comment after declaration)', () => {
      expectTransform(
        'var x,y=100;/* hello */'
      ).toReturn(
        'var x;/* hello */\nvar y=100;'
      );
    });

    it('should split into separate declarations(comment inside declaration)', () => {
      expectTransform(
        'var x,/* hello */y=100;'
      ).toReturn(
        'var x;\nvar /* hello */y=100;'
      );
    });
  });
});
