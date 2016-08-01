import _ from 'lodash';
import traverser from '../traverser';
import ArrowFunctionExpression from '../syntax/arrow-function-expression';
import {matchesAst, extract} from '../utils/matches-ast';
import copyComments from '../utils/copy-comments';

export default function(ast, logger) {
  traverser.replace(ast, {
    enter(node, parent) {
      if (isFunctionConvertableToArrow(node, parent)) {
        if (hasArguments(node.body)) {
          logger.warn(node, 'Can not use arguments in arrow function', 'arrow');
          return;
        }
        return functionToArrow(node);
      }

      const {func} = matchBoundFunction(node);
      if (func) {
        return functionToArrow(func);
      }
    }
  });
}

function isFunctionConvertableToArrow(node, parent) {
  return node.type === 'FunctionExpression' &&
    parent.type !== 'Property' &&
    parent.type !== 'MethodDefinition' &&
    !node.id &&
    !node.generator &&
    !hasThis(node.body);
}

// Matches: function(){}.bind(this)
var matchBoundFunction = matchesAst({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    computed: false,
    object: extract('func', {
      type: 'FunctionExpression',
      id: null,
      body: body => !hasArguments(body),
      generator: false
    }),
    property: {
      type: 'Identifier',
      name: 'bind'
    }
  },
  arguments: [
    {
      type: 'ThisExpression'
    }
  ]
});

function hasThis(ast) {
  return hasInFunctionBody(ast, {type: 'ThisExpression'});
}

function hasArguments(ast) {
  return hasInFunctionBody(ast, {type: 'Identifier', name: 'arguments'});
}

// Returns true when pattern matches any node in given function body,
// excluding any nested functions
function hasInFunctionBody(ast, pattern) {
  const predicate = _.matches(pattern);
  let found = false;

  traverser.traverse(ast, {
    enter(node) {
      if (predicate(node)) {
        found = true;
        this.break();
      }
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        this.skip();
      }
    }
  });

  return found;
}

function functionToArrow(func) {
  return new ArrowFunctionExpression({
    body: extractArrowBody(func.body),
    params: func.params,
    defaults: func.defaults,
    rest: func.rest,
  });
}

function extractArrowBody(block) {
  const returnStat = block.body[0];
  if (returnStat && returnStat.type === 'ReturnStatement') {
    const returnVal = returnStat.argument;
    // preserve return statement comments
    copyComments({from: returnStat, to: returnVal});
    return returnVal;
  }
  else {
    return block;
  }
}
