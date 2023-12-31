/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import ts from 'typescript';
import path from 'path';

import {
  COMPONENT_RENDER_FUNCTION,
  COMPONENT_CREATE_FUNCTION,
  COMPONENT_POP_FUNCTION,
  COMPONENT_BUTTON,
  COMPONENT_CREATE_LABEL_FUNCTION,
  COMPONENT_CREATE_CHILD_FUNCTION,
  COMPONENT_FOREACH,
  COMPONENT_LAZYFOREACH,
  IS_RENDERING_IN_PROGRESS,
  FOREACH_OBSERVED_OBJECT,
  FOREACH_GET_RAW_OBJECT,
  COMPONENT_IF,
  COMPONENT_IF_BRANCH_ID_FUNCTION,
  COMPONENT_IF_UNDEFINED,
  ATTRIBUTE_ANIMATION,
  GLOBAL_CONTEXT,
  COMPONENT_GESTURE,
  COMPONENT_GESTURE_GROUP,
  GESTURE_ATTRIBUTE,
  PARALLEL_GESTURE_ATTRIBUTE,
  PRIORITY_GESTURE_ATTRIBUTE,
  GESTURE_ENUM_KEY,
  GESTURE_ENUM_VALUE_HIGH,
  GESTURE_ENUM_VALUE_LOW,
  GESTURE_ENUM_VALUE_PARALLEL,
  COMPONENT_TRANSITION_NAME,
  COMPONENT_DEBUGLINE_FUNCTION,
  ATTRIBUTE_STATESTYLES,
  THIS,
  VISUAL_STATE,
  VIEW_STACK_PROCESSOR,
  STYLE_ADD_DOUBLE_DOLLAR,
  $$_VALUE,
  $$_CHANGE_EVENT,
  $$_THIS,
  $$_NEW_VALUE,
  BUILDER_ATTR_NAME,
  BUILDER_ATTR_BIND,
  CUSTOM_DIALOG_CONTROLLER_BUILDER,
  BIND_DRAG_SET,
  BIND_POPUP_SET,
  BIND_POPUP,
  CUSTOM_COMPONENT_DEFAULT,
  $$,
  PROPERTIES_ADD_DOUBLE_DOLLAR,
  ATTRIBUTE_ID,
  RESOURCE,
  ISINITIALRENDER,
  ELMTID,
  VIEWSTACKPROCESSOR,
  STOPGETACCESSRECORDING,
  STARTGETACCESSRECORDINGFOR,
  OBSERVECOMPONENTCREATION,
  OBSERVECOMPONENTCREATION2,
  ISLAZYCREATE,
  DEEPRENDERFUNCTION,
  ITEMCREATION,
  OBSERVEDSHALLOWRENDER,
  OBSERVEDDEEPRENDER,
  ItemComponents,
  FOREACHITEMGENFUNCTION,
  __LAZYFOREACHITEMGENFUNCTION,
  _ITEM,
  FOREACHITEMIDFUNC,
  __LAZYFOREACHITEMIDFUNC,
  FOREACHUPDATEFUNCTION,
  COMPONENT_INITIAl_RENDER_FUNCTION,
  LIST_ITEM,
  IFELSEBRANCHUPDATEFUNCTION,
  CARD_ENABLE_COMPONENTS,
  CARD_LOG_TYPE_COMPONENTS,
  COMPONENT_CONSTRUCTOR_PARENT,
  RESOURCE_NAME_TYPE,
  XCOMPONENT_SINGLE_QUOTATION,
  XCOMPONENT_DOUBLE_QUOTATION,
  XCOMPONENTTYPE,
  XCOMPONENTTYPE_CONTAINER,
  BIND_OBJECT_PROPERTY,
  TRUE,
  FALSE,
  HEADER,
  FOOTER,
  CALL,
  CREATE_BIND_COMPONENT,
  TabContentAndNavDestination,
  START,
  END,
  BUILDER_PARAM_PROXY,
  BUILDER_TYPE,
  CHECK_COMPONENT_EXTEND_DECORATOR,
  CHECK_COMPONENT_ANIMATABLE_EXTEND_DECORATOR,
  RECYCLE_REUSE_ID,
  UPDATE_FUNC_BY_ELMT_ID,
  CREATE_SET_METHOD,
  CAN_RETAKE,
  PREVIEW,
  ALL_COMPONENTS,
  ATTRIBUTE_ATTRIBUTE_MODIFIER,
  TITLE
} from './pre_define';
import {
  INNER_COMPONENT_NAMES,
  BUILDIN_CONTAINER_COMPONENT,
  BUILDIN_STYLE_NAMES,
  CUSTOM_BUILDER_METHOD,
  GESTURE_ATTRS,
  GESTURE_TYPE_NAMES,
  EXTEND_ATTRIBUTE,
  NO_DEBUG_LINE_COMPONENT,
  NEEDPOP_COMPONENT,
  INNER_STYLE_FUNCTION,
  GLOBAL_STYLE_FUNCTION,
  COMMON_ATTRS,
  CUSTOM_BUILDER_PROPERTIES,
  CUSTOM_BUILDER_PROPERTIES_WITHOUTKEY,
  CUSTOM_BUILDER_CONSTRUCTORS,
  INNER_CUSTOM_BUILDER_METHOD,
  GLOBAL_CUSTOM_BUILDER_METHOD,
  ID_ATTRS,
  SPECIFIC_PARENT_COMPONENT
} from './component_map';
import {
  componentCollection,
  builderParamObjectCollection,
  checkAllNode,
  enumCollection,
} from './validate_ui_syntax';
import {
  processCustomComponent,
  createConditionParent,
  isRecycle,
} from './process_custom_component';
import {
  LogType,
  LogInfo,
  componentInfo,
  storedFileInfo
} from './utils';
import {
  globalProgram,
  partialUpdateConfig,
  projectConfig
} from '../main';
import {
  transformLog,
  contextGlobal,
  validatorCard,
  builderTypeParameter
} from './process_ui_syntax';
import { props } from './compile_info';
import { regularCollection } from './validate_ui_syntax';

const checkComponents: Set<string> = new Set([
  "TextArea", "TextInput", "GridContainer"
]);

export function processComponentBuild(node: ts.MethodDeclaration,
  log: LogInfo[]): ts.MethodDeclaration {
  let newNode: ts.MethodDeclaration;
  let renderNode: ts.Identifier;
  if (!partialUpdateConfig.partialUpdateMode) {
    renderNode = ts.factory.createIdentifier(COMPONENT_RENDER_FUNCTION);
  } else {
    renderNode = ts.factory.createIdentifier(COMPONENT_INITIAl_RENDER_FUNCTION);
  }
  if (node.body && node.body.statements && node.body.statements.length &&
    validateRootNode(node, log)) {
    newNode = ts.factory.updateMethodDeclaration(node, ts.getModifiers(node),
      node.asteriskToken, renderNode, node.questionToken, node.typeParameters, node.parameters,
      node.type, processComponentBlock(node.body, false, log));
  } else {
    newNode = ts.factory.updateMethodDeclaration(node, ts.getModifiers(node),
      node.asteriskToken, renderNode, node.questionToken, node.typeParameters, node.parameters,
      node.type, node.body);
  }
  return newNode;
}

export function processComponentBlock(node: ts.Block, isLazy: boolean, log: LogInfo[],
  isTransition: boolean = false, isBuilder: boolean = false, parent: string = undefined,
  forEachParameters: ts.NodeArray<ts.ParameterDeclaration> = undefined, isGlobalBuilder: boolean = false): ts.Block {
  const newStatements: ts.Statement[] = [];
  processComponentChild(node, newStatements, log, {isAcceleratePreview: false, line: 0, column: 0, fileName: ''},
    isBuilder, parent, forEachParameters, isGlobalBuilder, isTransition);
  if (isLazy && !partialUpdateConfig.partialUpdateMode) {
    newStatements.unshift(createRenderingInProgress(true));
  }
  if (isTransition) {
    if (!partialUpdateConfig.partialUpdateMode) {
      newStatements.unshift(ts.factory.createExpressionStatement(
        createFunction(ts.factory.createIdentifier(COMPONENT_TRANSITION_NAME),
          ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION), null)));
    } else {
      newStatements.unshift(createComponentCreationStatement(ts.factory.createExpressionStatement(
        createFunction(ts.factory.createIdentifier(COMPONENT_TRANSITION_NAME),
          ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null)), [ts.factory.createExpressionStatement(
        createFunction(ts.factory.createIdentifier(COMPONENT_TRANSITION_NAME),
          ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION), null))], COMPONENT_TRANSITION_NAME, false, isTransition));
    }
    newStatements.push(ts.factory.createExpressionStatement(
      createFunction(ts.factory.createIdentifier(COMPONENT_TRANSITION_NAME),
        ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null)));
  }
  if (isLazy && !partialUpdateConfig.partialUpdateMode) {
    newStatements.push(createRenderingInProgress(false));
  }
  return ts.factory.updateBlock(node, newStatements);
}

function validateRootNode(node: ts.MethodDeclaration, log: LogInfo[]): boolean {
  let isValid: boolean = false;
  if (node.body.statements.length === 1) {
    const statement: ts.Statement = node.body.statements[0];
    if (ts.isIfStatement(statement) || validateFirstNode(statement)) {
      isValid = true;
    }
  } else {
    isValid = false;
  }
  if (!isValid) {
    log.push({
      type: LogType.ERROR,
      message: `There should have a root container component.`,
      pos: node.body.statements.pos
    });
  }
  return isValid;
}

function validateFirstNode(node: ts.Statement): boolean {
  const isEntryComponent: boolean =
    componentCollection.entryComponent === componentCollection.currentClassName;
  if (isEntryComponent && !validateContainerComponent(node)) {
    return false;
  }
  return true;
}

function validateContainerComponent(node: ts.Statement): boolean {
  if (ts.isExpressionStatement(node) && node.expression &&
    (ts.isEtsComponentExpression(node.expression) || ts.isCallExpression(node.expression))) {
    const nameResult: NameResult = { name: null, node: null, arguments: [] };
    validateEtsComponentNode(node.expression, nameResult);
    if (nameResult.name && checkContainer(nameResult.name, nameResult.node)) {
      return true;
    }
  }
  return false;
}

interface supplementType {
  isAcceleratePreview: boolean,
  line: number,
  column: number,
  fileName: string
}

let newsupplement: supplementType = {
  isAcceleratePreview: false,
  line: 0,
  column: 0,
  fileName: ''
};

type NameResult = {
  name: string,
  arguments: ts.NodeArray<ts.Expression> | [],
  node?: ts.Node
}

function validateEtsComponentNode(node: ts.CallExpression | ts.EtsComponentExpression, result?: NameResult) {
  let childNode: ts.Node = node;
  result.name = null;
  while (ts.isCallExpression(childNode) && childNode.expression &&
    ts.isPropertyAccessExpression(childNode.expression) && childNode.expression.expression) {
    childNode = childNode.expression.expression;
  }
  if (ts.isEtsComponentExpression(childNode)) {
    if (ts.isIdentifier(childNode.expression)) {
      result.name = childNode.expression.getText();
      result.node = childNode;
      result.arguments = childNode.arguments || [];
    }
    return true;
  } else {
    return false;
  }
}

let sourceNode: ts.SourceFile;

export function processComponentChild(node: ts.Block | ts.SourceFile, newStatements: ts.Statement[],
  log: LogInfo[], supplement: supplementType = {isAcceleratePreview: false, line: 0, column: 0, fileName: ''},
  isBuilder: boolean = false, parent: string = undefined,
  forEachParameters: ts.NodeArray<ts.ParameterDeclaration> = undefined, isGlobalBuilder: boolean = false,
  isTransition: boolean = false): void {
  if (supplement.isAcceleratePreview) {
    newsupplement = supplement;
    const compilerOptions = ts.readConfigFile(
      path.resolve(__dirname, '../tsconfig.json'), ts.sys.readFile).config.compilerOptions;
    Object.assign(compilerOptions, {
      'sourceMap': false
    });
    sourceNode = ts.createSourceFile('', node.getText(), ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS, compilerOptions);
  }
  if (node.statements.length) {
    // Save parent component
    const savedParent: string = parent;
    node.statements.forEach((item) => {
      if (ts.isExpressionStatement(item)) {
        checkEtsComponent(item, log);
        const name: string = getName(item);
        if (CARD_ENABLE_COMPONENTS.has(name)) {
          validatorCard(log, CARD_LOG_TYPE_COMPONENTS, item.getStart(), name);
        }
        switch (getComponentType(item, log, name, parent, forEachParameters)) {
          case ComponentType.innerComponent: {
            const [etsExpression, idName]: [ts.EtsComponentExpression, ts.Expression] =
              checkEtsAndIdInIf(item, savedParent);
            if (ts.isIdentifier(etsExpression.expression)) {
              parent = etsExpression.expression.escapedText.toString();
            }
            processInnerComponent(item, newStatements, log, parent, isBuilder, isGlobalBuilder, isTransition, idName, savedParent);
            break;
          }
          case ComponentType.customComponent: {
            const idName: ts.Expression = checkIdInIf(item, savedParent);
            parent = undefined;
            if (!newsupplement.isAcceleratePreview) {
              if (item.expression && ts.isEtsComponentExpression(item.expression) && item.expression.body) {
                const expressionResult: ts.ExpressionStatement =
                  processExpressionStatementChange(item, item.expression.body, log);
                if (expressionResult) {
                  item = expressionResult;
                }
              }
              processCustomComponent(item as ts.ExpressionStatement, newStatements, log, name,
                isBuilder, isGlobalBuilder, idName);
            }
            break;
          }
          case ComponentType.forEachComponent:
            parent = undefined;
            if (!partialUpdateConfig.partialUpdateMode) {
              processForEachComponent(item, newStatements, log, isBuilder, isGlobalBuilder);
            } else {
              processForEachComponentNew(item, newStatements, log, isGlobalBuilder);
            }
            break;
          case ComponentType.customBuilderMethod:
            parent = undefined;
            if (partialUpdateConfig.partialUpdateMode) {
              newStatements.push(transferBuilderCall(item, name, isBuilder));
            } else {
              newStatements.push(addInnerBuilderParameter(item, isGlobalBuilder));
            }
            break;
          case ComponentType.builderParamMethod:
            parent = undefined;
            if (partialUpdateConfig.partialUpdateMode) {
              newStatements.push(transferBuilderCall(item, name, isBuilder));
            } else {
              newStatements.push(addInnerBuilderParameter(item));
            }
            break;
          case ComponentType.builderTypeFunction:
            parent = undefined;
            if (partialUpdateConfig.partialUpdateMode) {
              newStatements.push(transferBuilderCall(item, name, isBuilder));
            } else {
              newStatements.push(addInnerBuilderParameter(item));
            }
            break;
          case ComponentType.function:
            parent = undefined;
            newStatements.push(item);
            break;
        }
      } else if (ts.isIfStatement(item)) {
        processIfStatement(item, newStatements, log, isBuilder, isGlobalBuilder);
      } else if (!ts.isBlock(item)) {
        log.push({
          type: LogType.ERROR,
          message: `Only UI component syntax can be written in build method.`,
          pos: item.getStart()
        });
      }
    });
  }
  if (supplement.isAcceleratePreview) {
    newsupplement = {
      isAcceleratePreview: false,
      line: 0,
      column: 0,
      fileName: ''
    };
  }
}

export function transferBuilderCall(node: ts.ExpressionStatement, name: string,
  isBuilder: boolean = false): ts.ExpressionStatement {
  if (node.expression && ts.isCallExpression(node.expression) && node.expression.arguments &&
    node.expression.arguments.length === 1 && ts.isObjectLiteralExpression(node.expression.arguments[0])) {
    return ts.factory.createExpressionStatement(ts.factory.createCallExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          node.expression.expression,
          ts.factory.createIdentifier(BUILDER_ATTR_BIND)
        ),
        undefined,
        [ts.factory.createThis()]
      ),
      undefined,
      [ts.factory.createCallExpression(
        ts.factory.createIdentifier(BUILDER_PARAM_PROXY),
        undefined,
        [
          ts.factory.createStringLiteral(name),
          traverseBuilderParams(node.expression.arguments[0], isBuilder)
        ]
      )]
    ));
  } else {
    return ts.factory.createExpressionStatement(ts.factory.createCallExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          node.expression.expression,
          ts.factory.createIdentifier(BUILDER_ATTR_BIND)
        ),
        undefined,
        [ts.factory.createThis()]
      ),
      undefined,
      node.expression.arguments
    ));
  }
}

function traverseBuilderParams(node: ts.ObjectLiteralExpression,
  isBuilder: boolean): ts.ObjectLiteralExpression {
  const properties: ts.ObjectLiteralElementLike[] = [];
  if (node.properties && node.properties.length) {
    node.properties.forEach(property => {
      if (ts.isPropertyAssignment(property) && property.initializer &&
        ts.isPropertyAccessExpression(property.initializer) && property.initializer.expression &&
        property.initializer.name && ts.isIdentifier(property.initializer.name)) {
        const name: string = property.initializer.name.escapedText.toString();
        if (!isBuilder && property.initializer.expression.kind === ts.SyntaxKind.ThisKeyword ||
          isBuilder && ts.isIdentifier(property.initializer.expression) &&
          property.initializer.expression.escapedText.toString() === $$) {
          addProperties(properties, property, name, isBuilder);
        } else {
          properties.push(ts.factory.createPropertyAssignment(
            property.name,
            ts.factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              property.initializer
            )
          ));
        }
      } else {
        properties.push(ts.factory.createPropertyAssignment(
          property.name,
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            property.initializer
          )
        ));
      }
    });
  }
  return ts.factory.createObjectLiteralExpression(properties);
}

function addProperties(properties: ts.ObjectLiteralElementLike[], property: ts.ObjectLiteralElementLike,
  name: string, isBuilder: boolean): void {
  properties.push(ts.factory.createPropertyAssignment(
    property.name,
    ts.factory.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.factory.createParenthesizedExpression(ts.factory.createConditionalExpression(
        ts.factory.createElementAccessExpression(
          isBuilder ? ts.factory.createIdentifier($$) : ts.factory.createThis(),
          ts.factory.createStringLiteral('__' + name)
        ),
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createElementAccessExpression(
          isBuilder ? ts.factory.createIdentifier($$) : ts.factory.createThis(),
          ts.factory.createStringLiteral('__' + name)
        ),
        ts.factory.createToken(ts.SyntaxKind.ColonToken),
        ts.factory.createElementAccessExpression(
          isBuilder ? ts.factory.createIdentifier($$) : ts.factory.createThis(),
          ts.factory.createStringLiteral(name)
        )
      ))
    )
  ));
}

function addInnerBuilderParameter(node: ts.ExpressionStatement,
  isGlobalBuilder: boolean = false): ts.ExpressionStatement {
  if (node.expression && ts.isCallExpression(node.expression) && node.expression.arguments) {
    node.expression.arguments.push(isGlobalBuilder ? parentConditionalExpression() : ts.factory.createThis());
    return ts.factory.createExpressionStatement(ts.factory.updateCallExpression(node.expression,
      node.expression.expression, node.expression.typeArguments, node.expression.arguments));
  } else {
    return node;
  }
}

function processExpressionStatementChange(node: ts.ExpressionStatement, nextNode: ts.Block,
  log: LogInfo[]): ts.ExpressionStatement {
  let name: string;
  // @ts-ignore
  if (node.expression.expression && ts.isIdentifier(node.expression.expression)) {
    name = node.expression.expression.escapedText.toString();
  }
  if (builderParamObjectCollection.get(name) &&
    builderParamObjectCollection.get(name).size === 1) {
    return processBlockToExpression(node, nextNode, log, name);
  } else {
    log.push({
      type: LogType.ERROR,
      message: `In the trailing lambda case, '${name}' must have one and only one property decorated with `
        + `@BuilderParam, and its @BuilderParam expects no parameter.`,
      pos: node.getStart()
    });
    return null;
  }
}

function processBlockToExpression(node: ts.ExpressionStatement, nextNode: ts.Block,
  log: LogInfo[], name: string): ts.ExpressionStatement {
  const childParam: string = [...builderParamObjectCollection.get(name)].slice(-1)[0];
  const newBlock: ts.Block = processComponentBlock(nextNode, false, log);
  const arrowNode: ts.ArrowFunction = ts.factory.createArrowFunction(undefined, undefined,
    [], undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), newBlock);
  const newPropertyAssignment:ts.PropertyAssignment = ts.factory.createPropertyAssignment(
    ts.factory.createIdentifier(childParam), arrowNode);
  // @ts-ignore
  let argumentsArray: ts.ObjectLiteralExpression[] = node.expression.arguments;
  if (argumentsArray && !argumentsArray.length) {
    argumentsArray = [ts.factory.createObjectLiteralExpression([newPropertyAssignment], true)];
  } else {
    argumentsArray = [ts.factory.createObjectLiteralExpression(
      // @ts-ignore
      node.expression.arguments[0].properties.concat([newPropertyAssignment]), true)];
  }
  const callNode: ts.CallExpression = ts.factory.updateCallExpression(
    // @ts-ignore
    node.expression, node.expression.expression, node.expression.expression.typeArguments,
    argumentsArray);
  // @ts-ignore
  node.expression.expression.parent = callNode;
  // @ts-ignore
  callNode.parent = node.expression.parent;
  node = ts.factory.updateExpressionStatement(node, callNode);
  return node;
}

type EtsComponentResult = {
  etsComponentNode: ts.EtsComponentExpression;
  hasAttr: boolean;
}
function parseEtsComponentExpression(node: ts.ExpressionStatement): EtsComponentResult {
  let etsComponentNode: ts.EtsComponentExpression;
  let hasAttr: boolean = false;
  let temp: any = node.expression;
  while (temp) {
    if (ts.isCallExpression(temp) && temp.expression &&
      ts.isPropertyAccessExpression(temp.expression)) {
      hasAttr = true;
    }
    if (ts.isEtsComponentExpression(temp)) {
      etsComponentNode = temp;
      break;
    }
    temp = temp.expression;
  }
  return { etsComponentNode: etsComponentNode, hasAttr: hasAttr };
}

function processInnerComponent(node: ts.ExpressionStatement, innerCompStatements: ts.Statement[],
  log: LogInfo[], parent: string = undefined, isBuilder: boolean = false, isGlobalBuilder: boolean = false,
  isTransition: boolean = false, idName: ts.Expression = undefined, savedParent: string = undefined): void {
  const newStatements: ts.Statement[] = [];
  const res: CreateResult = createComponent(node, COMPONENT_CREATE_FUNCTION);
  newStatements.push(res.newNode);
  const nameResult: NameResult = { name: null, arguments: [] };
  validateEtsComponentNode(node.expression as ts.EtsComponentExpression, nameResult);
  if (savedParent && nameResult.name) {
    checkNonspecificParents(node, nameResult.name, savedParent, log);
  }
  if (partialUpdateConfig.partialUpdateMode && ItemComponents.includes(nameResult.name)) {
    processItemComponent(node, nameResult, innerCompStatements, log, parent, isGlobalBuilder, idName);
  } else if (partialUpdateConfig.partialUpdateMode && TabContentAndNavDestination.has(nameResult.name)) {
    processTabAndNav(node, innerCompStatements, nameResult, log, parent, isGlobalBuilder, idName);
  } else {
    processNormalComponent(node, nameResult, innerCompStatements, log, parent, isBuilder, isGlobalBuilder,
      isTransition, idName);
  }
}

function processNormalComponent(node: ts.ExpressionStatement, nameResult: NameResult,
  innerCompStatements: ts.Statement[], log: LogInfo[], parent: string = undefined, isBuilder: boolean = false,
  isGlobalBuilder: boolean = false, isTransition: boolean = false, idName: ts.Expression = undefined): void {
  const newStatements: ts.Statement[] = [];
  const immutableStatements: ts.Statement[] = [];
  const res: CreateResult = createComponent(node, COMPONENT_CREATE_FUNCTION);
  newStatements.push(res.newNode);
  processDebug(node, nameResult, newStatements);
  const etsComponentResult: EtsComponentResult = parseEtsComponentExpression(node);
  const componentName: string = res.identifierNode.getText();
  if (PROPERTIES_ADD_DOUBLE_DOLLAR.has(componentName) &&
    etsComponentResult.etsComponentNode.arguments && etsComponentResult.etsComponentNode.arguments.length) {
    etsComponentResult.etsComponentNode = processDollarEtsComponent(etsComponentResult.etsComponentNode,
      componentName);
  }
  let judgeIdStart: number;
  if (partialUpdateConfig.partialUpdateMode && idName) {
    judgeIdStart = innerCompStatements.length;
  }
  if (etsComponentResult.etsComponentNode.body && ts.isBlock(etsComponentResult.etsComponentNode.body)) {
    if (res.isButton) {
      checkButtonParamHasLabel(etsComponentResult.etsComponentNode, log);
      if (projectConfig.isPreview) {
        newStatements.splice(-2, 1, createComponent(node, COMPONENT_CREATE_CHILD_FUNCTION).newNode);
      } else {
        newStatements.splice(-1, 1, createComponent(node, COMPONENT_CREATE_CHILD_FUNCTION).newNode);
      }
    }
    if (etsComponentResult.hasAttr) {
      bindComponentAttr(node, res.identifierNode, newStatements, log, true, false, immutableStatements);
    }
    processInnerCompStatements(innerCompStatements, newStatements, node, isGlobalBuilder,
      isTransition, undefined, immutableStatements, componentName);
    processComponentChild(etsComponentResult.etsComponentNode.body, innerCompStatements, log,
      {isAcceleratePreview: false, line: 0, column: 0, fileName: ''}, isBuilder, parent, undefined, isGlobalBuilder, false);
  } else {
    bindComponentAttr(node, res.identifierNode, newStatements, log, true, false, immutableStatements);
    processInnerCompStatements(innerCompStatements, newStatements, node, isGlobalBuilder,
      isTransition, undefined, immutableStatements, componentName);
  }
  if (res.isContainerComponent || res.needPop) {
    innerCompStatements.push(createComponent(node, COMPONENT_POP_FUNCTION).newNode);
  }
  if (partialUpdateConfig.partialUpdateMode && idName) {
    innerCompStatements.splice(judgeIdStart, innerCompStatements.length - judgeIdStart,
      ifRetakeId(innerCompStatements.slice(judgeIdStart), idName));
  }
}

export function ifRetakeId(blockContent: ts.Statement[], idName: ts.Expression): ts.IfStatement {
  return ts.factory.createIfStatement(
    ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier(COMPONENT_IF),
          ts.factory.createIdentifier(CAN_RETAKE)
        ),
        undefined,
        [idName]
      )
    ),
    ts.factory.createBlock(
      blockContent,
      true
    ),
    undefined
  );
}

function processDebug(node: ts.Statement, nameResult: NameResult, newStatements: ts.Statement[],
  getNode: boolean = false): ts.ExpressionStatement {
  if ((projectConfig.isPreview || projectConfig.enableDebugLine) && nameResult.name &&
    !NO_DEBUG_LINE_COMPONENT.has(nameResult.name)) {
    let posOfNode: ts.LineAndCharacter;
    let curFileName: string;
    let line: number = 1;
    let col: number = 1;
    if (sourceNode && newsupplement.isAcceleratePreview) {
      posOfNode = sourceNode.getLineAndCharacterOfPosition(getRealNodePos(node) - 22);
      curFileName = newsupplement.fileName;
      if (posOfNode.line === 0) {
        col = newsupplement.column - 1;
      }
      line = newsupplement.line;
    } else {
      posOfNode = transformLog.sourceFile.getLineAndCharacterOfPosition(getRealNodePos(node));
      curFileName = transformLog.sourceFile.fileName.replace(/\.ts$/, '');
    }
    let debugInfo: string;
    if (projectConfig.isPreview) {
      if (projectConfig.minAPIVersion >= 11) {
        debugInfo = `${path.relative(projectConfig.projectRootPath, curFileName).replace(/\\+/g, '/')}` +
          `(${posOfNode.line + line}:${posOfNode.character + col})`;
      } else {
        debugInfo = `${path.relative(projectConfig.projectPath, curFileName).replace(/\\+/g, '/')}` +
          `(${posOfNode.line + line}:${posOfNode.character + col})`;
      }
    } else if (projectConfig.enableDebugLine) {
      debugInfo = `${path.relative(projectConfig.projectRootPath, curFileName)}` +
        `(${posOfNode.line + line}:${posOfNode.character + col})`;
    }
    const debugNode: ts.ExpressionStatement = ts.factory.createExpressionStatement(
      createFunction(ts.factory.createIdentifier(nameResult.name),
        ts.factory.createIdentifier(COMPONENT_DEBUGLINE_FUNCTION),
        ts.factory.createNodeArray([ts.factory.createStringLiteral(debugInfo)])));
    if (getNode) {
      return debugNode;
    }
    newStatements.push(debugNode);
  }
}

function processInnerCompStatements(innerCompStatements: ts.Statement[],
  newStatements: ts.Statement[], node: ts.Statement, isGlobalBuilder: boolean, isTransition: boolean,
  nameResult: NameResult, immutableStatements: ts.Statement[], componentName: string): void {
  if (!partialUpdateConfig.partialUpdateMode) {
    innerCompStatements.push(...newStatements);
  } else {
    innerCompStatements.push(createComponentCreationStatement(node, newStatements, componentName,
      isGlobalBuilder, isTransition, nameResult, immutableStatements));
  }
}

export function createComponentCreationStatement(node: ts.Statement, innerStatements: ts.Statement[],
  componentName: string, isGlobalBuilder: boolean = false, isTransition: boolean = false,
  nameResult: NameResult = undefined, immutableStatements: ts.Statement[] = null): ts.Statement {
  const blockArr: ts.Statement[] = [...innerStatements];
  if (nameResult) {
    blockArr.push(processDebug(node, nameResult, innerStatements, true));
  }
  if (!isTransition) {
    createInitRenderStatement(node, immutableStatements, blockArr);
  }
  if (!partialUpdateConfig.optimizeComponent) {
    blockArr.unshift(createViewStackProcessorStatement(STARTGETACCESSRECORDINGFOR, ELMTID));
    blockArr.push(createViewStackProcessorStatement(STOPGETACCESSRECORDING));
  }
  const creationArgs: ts.Expression[] = [
    ts.factory.createArrowFunction(undefined, undefined,
      [
        ts.factory.createParameterDeclaration(undefined, undefined,
          ts.factory.createIdentifier(ELMTID), undefined, undefined, undefined),
        ts.factory.createParameterDeclaration(undefined, undefined,
          ts.factory.createIdentifier(ISINITIALRENDER), undefined, undefined, undefined)
      ], undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.factory.createBlock(blockArr, true)
    )
  ];
  if (partialUpdateConfig.optimizeComponent) {
    creationArgs.push(isTransition ? ts.factory.createNull() :
      ts.factory.createIdentifier(componentName));
  }
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(createConditionParent(isGlobalBuilder),
        ts.factory.createIdentifier(partialUpdateConfig.optimizeComponent ?
          OBSERVECOMPONENTCREATION2: OBSERVECOMPONENTCREATION)
      ), undefined, creationArgs)
  );
}

export function createViewStackProcessorStatement(propertyAccessName: string, elmtId?: string): ts.Statement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(VIEWSTACKPROCESSOR),
        ts.factory.createIdentifier(propertyAccessName)
      ),
      undefined,
      elmtId ? [ts.factory.createIdentifier(ELMTID)] : []
    )
  );
}

function createInitRenderStatement(node: ts.Statement,
  immutableStatements: ts.Statement[], blockArr: ts.Statement[]): void {
  if (partialUpdateConfig.optimizeComponent) {
    if (immutableStatements && immutableStatements.length) {
      blockArr.push(ts.factory.createIfStatement(
        ts.factory.createIdentifier(ISINITIALRENDER),
        ts.factory.createBlock(immutableStatements, true)
      ));
    }
  } else {
    blockArr.push(ts.factory.createIfStatement(
      ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        ts.factory.createIdentifier(ISINITIALRENDER)
      ),
      ts.factory.createBlock(
        [
          ts.isExpressionStatement(node) ?
            createComponent(node, COMPONENT_POP_FUNCTION).newNode : createIfPop()
        ],
        true
      ),
      immutableStatements && immutableStatements.length ?
        ts.factory.createBlock(immutableStatements, true) : undefined
    ));
  }
}

function processItemComponent(node: ts.ExpressionStatement, nameResult: NameResult, innerCompStatements: ts.Statement[],
  log: LogInfo[], parent: string = undefined, isGlobalBuilder: boolean = false, idName: ts.Expression = undefined): void {
  const itemRenderInnerStatements: ts.Statement[] = [];
  const immutableStatements: ts.Statement[] = [];
  const deepItemRenderInnerStatements: ts.Statement[] = [];
  const res: CreateResult = createComponent(node, COMPONENT_CREATE_FUNCTION);
  const isLazyCreate: boolean = checkLazyCreate(node, nameResult);
  const itemCreateStatement: ts.Statement = createItemCreate(nameResult, isLazyCreate);
  itemRenderInnerStatements.push(itemCreateStatement);
  const etsComponentResult: EtsComponentResult = parseEtsComponentExpression(node);
  if (etsComponentResult.etsComponentNode.body && ts.isBlock(etsComponentResult.etsComponentNode.body)) {
    if (etsComponentResult.hasAttr) {
      bindComponentAttr(node, res.identifierNode, itemRenderInnerStatements, log, true, false, immutableStatements);
    }
    processComponentChild(etsComponentResult.etsComponentNode.body, deepItemRenderInnerStatements, log,
      {isAcceleratePreview: false, line: 0, column: 0, fileName: ''}, false, parent, undefined, isGlobalBuilder, false);
  } else {
    bindComponentAttr(node, res.identifierNode, itemRenderInnerStatements, log, true, false, immutableStatements);
  }
  let generateItem: ts.IfStatement | ts.Block;
  if (idName) {
    generateItem = ifRetakeId([createItemBlock(
      node, itemRenderInnerStatements, deepItemRenderInnerStatements, nameResult, isLazyCreate,
      immutableStatements)], idName);
  } else {
    generateItem = createItemBlock(
      node, itemRenderInnerStatements, deepItemRenderInnerStatements, nameResult, isLazyCreate,
      immutableStatements);
  }
  innerCompStatements.push(generateItem);
}

function createItemCreate(nameResult: NameResult, isLazyCreate: boolean): ts.Statement {
  const itemCreateArgs: ts.Expression[] = [];
  if (isLazyCreate) {
    itemCreateArgs.push(ts.factory.createIdentifier(DEEPRENDERFUNCTION), ts.factory.createTrue());
  } else {
    itemCreateArgs.push(
      ts.factory.createArrowFunction(undefined, undefined, [], undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock([], false)),
      ts.factory.createFalse()
    );
  }
  itemCreateArgs.push(...nameResult.arguments);
  return ts.factory.createExpressionStatement(ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(nameResult.name),
      ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION)), undefined, itemCreateArgs));
}

function createItemBlock(
  node: ts.ExpressionStatement,
  itemRenderInnerStatements: ts.Statement[],
  deepItemRenderInnerStatements: ts.Statement[],
  nameResult: NameResult, isLazyCreate: boolean,
  immutableStatements: ts.Statement[]
): ts.Block {
  const blockNode: ts.Statement[] = [
    createItemCreation(node, itemRenderInnerStatements, nameResult, immutableStatements)
  ];
  if (isLazyCreate) {
    blockNode.push(
      createDeepRenderFunction(node, deepItemRenderInnerStatements),
      ts.factory.createExpressionStatement(ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createThis(),
          ts.factory.createIdentifier(OBSERVECOMPONENTCREATION)
        ),
        undefined,
        [ts.factory.createIdentifier(ITEMCREATION)]
      )),
      createComponent(node, COMPONENT_POP_FUNCTION).newNode
    );
  } else {
    blockNode.push(
      createObservedDeepRender(node, deepItemRenderInnerStatements),
      ts.factory.createExpressionStatement(ts.factory.createCallExpression(
        ts.factory.createIdentifier(OBSERVEDDEEPRENDER), undefined, []))
    );
  }
  return ts.factory.createBlock(blockNode, true);
}

function checkLazyCreate(node: ts.ExpressionStatement, nameResult: NameResult): boolean {
  if (nameResult.name === LIST_ITEM) {
    if (nameResult.arguments.length && ts.isStringLiteral(nameResult.arguments[0]) &&
      nameResult.arguments[0].text === 'false') {
      return false;
    }
    if (isLazyForEachChild(node)) {
      return false;
    }
    return true;
  }
  return false;
}

function createItemCreation(
  node: ts.ExpressionStatement,
  itemRenderInnerStatements: ts.Statement[],
  nameResult: NameResult,
  immutableStatements: ts.Statement[]
): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier(ITEMCREATION), undefined, undefined,
        ts.factory.createArrowFunction(undefined, undefined,
          [
            ts.factory.createParameterDeclaration(undefined, undefined,
              ts.factory.createIdentifier(ELMTID), undefined, undefined, undefined),
            ts.factory.createParameterDeclaration(undefined, undefined,
              ts.factory.createIdentifier(ISINITIALRENDER), undefined, undefined, undefined)
          ], undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createBlock(
            [
              createViewStackProcessorStatement(STARTGETACCESSRECORDINGFOR, ELMTID),
              ...itemRenderInnerStatements,
              processDebug(node, nameResult, itemRenderInnerStatements, true),
              ts.factory.createIfStatement(
                ts.factory.createPrefixUnaryExpression(
                  ts.SyntaxKind.ExclamationToken,
                  ts.factory.createIdentifier(ISINITIALRENDER)
                ),
                ts.factory.createBlock(
                  [createComponent(node, COMPONENT_POP_FUNCTION).newNode],
                  true
                ),
                immutableStatements && immutableStatements.length ?
                  ts.factory.createBlock(immutableStatements, true) : undefined
              ),
              createViewStackProcessorStatement(STOPGETACCESSRECORDING)
            ],
            true
          )
        )
      )],
      ts.NodeFlags.Const
    )
  );
}

function createDeepRenderFunction(
  node: ts.ExpressionStatement,
  deepItemRenderInnerStatements: ts.Statement[]
): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier(DEEPRENDERFUNCTION), undefined, undefined,
        ts.factory.createArrowFunction(undefined, undefined,
          [
            ts.factory.createParameterDeclaration(undefined, undefined,
              ts.factory.createIdentifier(ELMTID), undefined, undefined, undefined),
            ts.factory.createParameterDeclaration(undefined, undefined,
              ts.factory.createIdentifier(ISINITIALRENDER), undefined, undefined, undefined)
          ], undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createBlock(
            [
              ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                ts.factory.createIdentifier(ITEMCREATION), undefined,
                [
                  ts.factory.createIdentifier(ELMTID),
                  ts.factory.createIdentifier(ISINITIALRENDER)
                ]
              )),
              ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createThis(),
                    ts.factory.createIdentifier(UPDATE_FUNC_BY_ELMT_ID)
                  ),
                  ts.factory.createIdentifier(CREATE_SET_METHOD)
                ), undefined,
                [ts.factory.createIdentifier(ELMTID), ts.factory.createIdentifier(ITEMCREATION)]
              )),
              ...deepItemRenderInnerStatements,
              createComponent(node, COMPONENT_POP_FUNCTION).newNode
            ],
            true
          )
        )
      )],
      ts.NodeFlags.Const
    )
  );
}

function createObservedDeepRender(
  node: ts.ExpressionStatement,
  deepItemRenderInnerStatements: ts.Statement[]
): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier(OBSERVEDDEEPRENDER),
        undefined,
        undefined,
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createBlock(
            [
              ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createThis(),
                  ts.factory.createIdentifier(OBSERVECOMPONENTCREATION)
                ),
                undefined,
                [ts.factory.createIdentifier(ITEMCREATION)]
              )),
              ...deepItemRenderInnerStatements,
              createComponent(node, COMPONENT_POP_FUNCTION).newNode
            ],
            true
          )
        )
      )],
      ts.NodeFlags.Const
    )
  );
}

function processTabAndNav(node: ts.ExpressionStatement, innerCompStatements: ts.Statement[],
  nameResult: NameResult, log: LogInfo[], parent: string = undefined, isGlobalBuilder: boolean = false,
  idName: ts.Expression = undefined): void {
  const name: string = nameResult.name;
  const TabContentComp: ts.EtsComponentExpression = getEtsComponentExpression(node);
  const TabContentBody: ts.Block = TabContentComp.body;
  let tabContentCreation: ts.Statement;
  const tabContentPop: ts.Statement = ts.factory.createExpressionStatement(ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(name),
      ts.factory.createIdentifier(COMPONENT_POP_FUNCTION)), undefined, []));
  const tabAttrs: ts.Statement[] = [];
  const immutableStatements: ts.Statement[] = [];
  let judgeIdStart: number;
  if (idName) {
    judgeIdStart = innerCompStatements.length;
  }
  if (TabContentBody && TabContentBody.statements.length) {
    const newTabContentChildren: ts.Statement[] = [];
    processComponentChild(TabContentBody, newTabContentChildren, log, {isAcceleratePreview: false, line: 0, column: 0, fileName: ''}, false, parent);
    tabContentCreation = ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(name), ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION)),
      undefined, [ts.factory.createArrowFunction(undefined, undefined, [], undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock([...newTabContentChildren], true))]));
    bindComponentAttr(node, ts.factory.createIdentifier(name), tabAttrs, log, true, false, immutableStatements);
    processInnerCompStatements(
      innerCompStatements, [tabContentCreation, ...tabAttrs], node, isGlobalBuilder, false,
      nameResult, immutableStatements, name);
  } else {
    tabContentCreation = ts.factory.createExpressionStatement(ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(name),
        ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION)), undefined, []));
    bindComponentAttr(node, ts.factory.createIdentifier(name), tabAttrs, log, true, false, immutableStatements);
    processInnerCompStatements(
      innerCompStatements, [tabContentCreation, ...tabAttrs], node, isGlobalBuilder, false,
      nameResult, immutableStatements, name);
  }
  innerCompStatements.push(tabContentPop);
  if (idName) {
    innerCompStatements.splice(judgeIdStart, innerCompStatements.length - judgeIdStart,
      ifRetakeId(innerCompStatements.slice(judgeIdStart), idName));
  }
}

export function getRealNodePos(node: ts.Node): number {
  // @ts-ignore
  if (node.pos === -1 && node.expression) {
    // @ts-ignore
    return getRealNodePos(node.expression);
  } else {
    return node.getStart();
  }
}

function processForEachComponent(node: ts.ExpressionStatement, newStatements: ts.Statement[],
  log: LogInfo[], isBuilder: boolean = false, isGlobalBuilder: boolean = false): void {
  const popNode: ts.ExpressionStatement = ts.factory.createExpressionStatement(createFunction(
    // @ts-ignore
    node.expression.expression as ts.Identifier,
    ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null));
  if (ts.isCallExpression(node.expression)) {
    const propertyNode: ts.PropertyAccessExpression = ts.factory.createPropertyAccessExpression(
      node.expression.expression as ts.Identifier,
      ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION)
    );
    const argumentsArray: ts.Expression[] = Array.from(node.expression.arguments);
    let arrayObserveredObject: ts.CallExpression;
    if (argumentsArray.length) {
      arrayObserveredObject = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(FOREACH_OBSERVED_OBJECT),
          ts.factory.createIdentifier(FOREACH_GET_RAW_OBJECT)), undefined, [argumentsArray[0]]);
    }
    argumentsArray.splice(0, 1, arrayObserveredObject);
    const newArrowNode: ts.ArrowFunction =
      processForEachBlock(node.expression, log, isBuilder) as ts.ArrowFunction;
    if (newArrowNode) {
      argumentsArray.splice(1, 1, newArrowNode);
    }
    node = addForEachId(ts.factory.updateExpressionStatement(node, ts.factory.updateCallExpression(
      node.expression, propertyNode, node.expression.typeArguments, argumentsArray)), isGlobalBuilder);
  }
  newStatements.push(node, popNode);
}

function processForEachComponentNew(node: ts.ExpressionStatement, newStatements: ts.Statement[],
  log: LogInfo[], isGlobalBuilder: boolean = false): void {
  const newForEachStatements: ts.Statement[] = [];
  const popNode: ts.ExpressionStatement = ts.factory.createExpressionStatement(createFunction(
    (node.expression as ts.CallExpression).expression as ts.Identifier,
    ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null));
  if (ts.isCallExpression(node.expression)) {
    const argumentsArray: ts.Expression[] = Array.from(node.expression.arguments);
    const propertyNode: ts.ExpressionStatement = ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(
        node.expression.expression as ts.Identifier,
        ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION)), undefined, []));
    const newArrowNode: ts.NodeArray<ts.Statement> =
      processForEachBlock(node.expression, log, false, isGlobalBuilder) as ts.NodeArray<ts.Statement>;
    const itemGenFunctionStatement: ts.VariableStatement = createItemGenFunctionStatement(node.expression,
      argumentsArray, newArrowNode);
    const itemIdFuncStatement: ts.VariableStatement = createItemIdFuncStatement(node.expression, argumentsArray);
    const updateFunctionStatement: ts.ExpressionStatement = createUpdateFunctionStatement(argumentsArray, isGlobalBuilder);
    const lazyForEachStatement: ts.ExpressionStatement = createLazyForEachStatement(argumentsArray);
    if (node.expression.expression.getText() === COMPONENT_FOREACH) {
      newForEachStatements.push(propertyNode, itemGenFunctionStatement, updateFunctionStatement);
      newStatements.push(createComponentCreationStatement(node, newForEachStatements, COMPONENT_FOREACH, isGlobalBuilder), popNode);
    } else {
      if (argumentsArray[2]) {
        newStatements.push(ts.factory.createBlock([itemGenFunctionStatement, itemIdFuncStatement, lazyForEachStatement,
          popNode], true));
      } else {
        newStatements.push(ts.factory.createBlock([itemGenFunctionStatement, lazyForEachStatement, popNode], true));
      }
    }
  }
}

function createItemGenFunctionStatement(
  node: ts.CallExpression,
  argumentsArray: ts.Expression[],
  newArrowNode: ts.NodeArray<ts.Statement>
): ts.VariableStatement {
  if (argumentsArray[1] && ts.isArrowFunction(argumentsArray[1])) {
    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(node.expression.getText() === COMPONENT_FOREACH ?
            FOREACHITEMGENFUNCTION : __LAZYFOREACHITEMGENFUNCTION),
          undefined, undefined,
          ts.factory.createArrowFunction(
            undefined, undefined,
            argumentsArray[1].parameters && argumentsArray[1].parameters.length >= 1 ?
              getParameters(argumentsArray[1]) : [],
            undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createBlock(
              argumentsArray[1].parameters && argumentsArray[1].parameters.length >= 1 ?
                isForEachItemGeneratorParam(argumentsArray, newArrowNode) :
                newArrowNode ? [...newArrowNode] : undefined,
              true
            )
          )
        )
        ],
        ts.NodeFlags.Const
      )
    );
  }
}

function isForEachItemGeneratorParam(argumentsArray: ts.Expression[], newArrowNode: ts.NodeArray<ts.Statement>): ts.Statement[] {
  return [
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(
            argumentsArray[1].parameters[0] && argumentsArray[1].parameters[0].name.getText()),
          undefined,
          undefined,
          ts.factory.createIdentifier(_ITEM)
        )],
        ts.NodeFlags.Const
      )
    ),
    ...newArrowNode
  ];
}

function getParameters(node: ts.ArrowFunction): ts.ParameterDeclaration[] {
  const parameterArr: ts.ParameterDeclaration[] = [
    ts.factory.createParameterDeclaration(
      undefined, undefined, ts.factory.createIdentifier(_ITEM))
  ];
  if (node.parameters && node.parameters.length > 1) {
    parameterArr.push(node.parameters[1]);
  }
  return parameterArr;
}

function createItemIdFuncStatement(
  node: ts.CallExpression,
  argumentsArray: ts.Expression[]
): ts.VariableStatement {
  if (argumentsArray[2] && ts.isArrowFunction(argumentsArray[2])) {
    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(node.expression.getText() === COMPONENT_FOREACH ?
            FOREACHITEMIDFUNC : __LAZYFOREACHITEMIDFUNC), undefined, undefined,
          argumentsArray[2]
        )],
        ts.NodeFlags.Const
      )
    );
  }
}

function createUpdateFunctionStatement(argumentsArray: ts.Expression[],
  isGlobalBuilder: boolean = false): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        isGlobalBuilder ? parentConditionalExpression() : ts.factory.createThis(),
        ts.factory.createIdentifier(FOREACHUPDATEFUNCTION)
      ),
      undefined,
      addForEachIdFuncParameter(argumentsArray)
    )
  );
}

function addForEachIdFuncParameter(argumentsArray: ts.Expression[]): ts.Expression[] {
  const addForEachIdFuncParameterArr: ts.Expression[] = [];
  addForEachIdFuncParameterArr.push(
    ts.factory.createIdentifier(ELMTID),
    argumentsArray[0],
    ts.factory.createIdentifier(FOREACHITEMGENFUNCTION)
  );
  // @ts-ignore
  if (argumentsArray[1] && argumentsArray[1].parameters && argumentsArray[1].parameters[1]) {
    if (!argumentsArray[2]) {
      addForEachIdFuncParameterArr.push(...addForEachParameter(ts.factory.createIdentifier(COMPONENT_IF_UNDEFINED), TRUE, FALSE));
    } else {
      // @ts-ignore
      argumentsArray[2].parameters && argumentsArray[2].parameters[1] ?
        addForEachIdFuncParameterArr.push(...addForEachParameter(argumentsArray[2], TRUE, TRUE)) :
        addForEachIdFuncParameterArr.push(...addForEachParameter(argumentsArray[2], TRUE, FALSE));
    }
  }
  // @ts-ignore
  if (argumentsArray[1] && !argumentsArray[1].parameters[1] && argumentsArray[2]) {
    // @ts-ignore
    argumentsArray[2].parameters && argumentsArray[2].parameters[1] ?
      addForEachIdFuncParameterArr.push(...addForEachParameter(argumentsArray[2], FALSE, TRUE)) :
      addForEachIdFuncParameterArr.push(...addForEachParameter(argumentsArray[2], FALSE, FALSE));
  }
  return addForEachIdFuncParameterArr;
}

function addForEachParameter(forEachItemIdContent: ts.Expression, forEachItemGen: string, forEachItemId: string): ts.Expression[] {
  return [forEachItemIdContent, ts.factory.createIdentifier(forEachItemGen),
    ts.factory.createIdentifier(forEachItemId)];
}

function createLazyForEachStatement(argumentsArray: ts.Expression[]): ts.ExpressionStatement {
  const parameterList: ts.Expression[] = [
    ts.factory.createStringLiteral(componentInfo.id.toString()),
    ts.factory.createThis(),
    argumentsArray[0],
    ts.factory.createIdentifier(__LAZYFOREACHITEMGENFUNCTION)
  ];
  if (argumentsArray.length >= 3 && argumentsArray[2]) {
    parameterList.push(ts.factory.createIdentifier(__LAZYFOREACHITEMIDFUNC));
  }
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(COMPONENT_LAZYFOREACH),
        ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION)
      ),
      undefined,
      parameterList
    )
  );
}

function addForEachId(node: ts.ExpressionStatement, isGlobalBuilder: boolean = false): ts.ExpressionStatement {
  const forEachComponent: ts.CallExpression = node.expression as ts.CallExpression;
  return ts.factory.updateExpressionStatement(node, ts.factory.updateCallExpression(
    forEachComponent, forEachComponent.expression, forEachComponent.typeArguments,
    [ts.factory.createStringLiteral((++componentInfo.id).toString()),
      isGlobalBuilder ? parentConditionalExpression() : ts.factory.createThis(),
      ...forEachComponent.arguments]));
}

export function parentConditionalExpression(): ts.ConditionalExpression {
  return ts.factory.createConditionalExpression(
    ts.factory.createIdentifier(COMPONENT_CONSTRUCTOR_PARENT),
    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    ts.factory.createIdentifier(COMPONENT_CONSTRUCTOR_PARENT),
    ts.factory.createToken(ts.SyntaxKind.ColonToken),
    ts.factory.createThis());
}

function processForEachBlock(node: ts.CallExpression, log: LogInfo[],
  isBuilder: boolean = false, isGlobalBuilder: boolean = false): ts.NodeArray<ts.Statement> | ts.ArrowFunction {
  if (node.arguments.length > 1 && ts.isArrowFunction(node.arguments[1])) {
    const isLazy: boolean = node.expression.getText() === COMPONENT_LAZYFOREACH;
    const arrowNode: ts.ArrowFunction = node.arguments[1] as ts.ArrowFunction;
    const body: ts.ConciseBody = arrowNode.body;
    if (node.arguments.length > 2 && !ts.isArrowFunction(node.arguments[2])) {
      log.push({
        type: LogType.ERROR,
        message: 'There should be wrapped in curly braces in ForEach.',
        pos: body.getStart()
      });
    } else if (!ts.isBlock(body)) {
      const statement: ts.Statement = ts.factory.createExpressionStatement(body);
      const blockNode: ts.Block = ts.factory.createBlock([statement], true);
      // @ts-ignore
      statement.parent = blockNode;
      if (!partialUpdateConfig.partialUpdateMode) {
        return ts.factory.updateArrowFunction(
          arrowNode, ts.getModifiers(arrowNode), arrowNode.typeParameters, arrowNode.parameters,
          arrowNode.type, arrowNode.equalsGreaterThanToken,
          processComponentBlock(blockNode, isLazy, log, false, false, undefined,
            arrowNode.parameters, isGlobalBuilder));
      } else {
        return processComponentBlock(blockNode, isLazy, log, false, false, undefined, arrowNode.parameters).statements;
      }
    } else {
      if (!partialUpdateConfig.partialUpdateMode) {
        return ts.factory.updateArrowFunction(
          arrowNode, ts.getModifiers(arrowNode), arrowNode.typeParameters, arrowNode.parameters,
          arrowNode.type, arrowNode.equalsGreaterThanToken,
          processComponentBlock(body, isLazy, log, false, isBuilder, undefined, arrowNode.parameters));
      } else {
        return processComponentBlock(body, isLazy, log, false, false, undefined, arrowNode.parameters, isGlobalBuilder).statements;
      }
    }
  }
  return null;
}

function createRenderingInProgress(isTrue: boolean): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createThis(),
      ts.factory.createIdentifier(IS_RENDERING_IN_PROGRESS)
    ),
    ts.factory.createToken(ts.SyntaxKind.EqualsToken),
    isTrue ? ts.factory.createTrue() : ts.factory.createFalse()
  ));
}

function processIfStatement(node: ts.IfStatement, newStatements: ts.Statement[],
  log: LogInfo[], isBuilder: boolean = false, isGlobalBuilder: boolean = false): void {
  const ifCreate: ts.ExpressionStatement = createIfCreate();
  const newIfNode: ts.IfStatement = processInnerIfStatement(node, 0, log, isBuilder, isGlobalBuilder);
  const ifPop: ts.ExpressionStatement = createIfPop();
  if (!partialUpdateConfig.partialUpdateMode) {
    newStatements.push(ifCreate, newIfNode, ifPop);
  } else {
    newStatements.push(createComponentCreationStatement(node, [ifCreate, newIfNode], COMPONENT_IF, isGlobalBuilder), ifPop);
  }
}

function processInnerIfStatement(node: ts.IfStatement, id: number, log: LogInfo[],
  isBuilder: boolean = false, isGlobalBuilder: boolean = false): ts.IfStatement {
  if (ts.isIdentifier(node.expression) && node.expression.originalKeywordKind === undefined &&
    !node.expression.escapedText) {
    log.push({
      type: LogType.ERROR,
      message: 'Condition expression cannot be null in if statement.',
      pos: node.expression.getStart()
    });
    node = ts.factory.updateIfStatement(node, ts.factory.createIdentifier(COMPONENT_IF_UNDEFINED),
      node.thenStatement, node.elseStatement);
  }
  const newThenStatement: ts.Statement = processThenStatement(node.thenStatement, id, log, isBuilder, isGlobalBuilder);
  const newElseStatement: ts.Statement = processElseStatement(node.elseStatement, id, log, isBuilder, isGlobalBuilder);
  const newIfNode: ts.IfStatement = ts.factory.updateIfStatement(
    node, node.expression, newThenStatement, newElseStatement);
  return newIfNode;
}

function processThenStatement(thenStatement: ts.Statement, id: number,
  log: LogInfo[], isBuilder: boolean = false, isGlobalBuilder: boolean = false): ts.Statement {
  if (ts.isExpressionStatement(thenStatement) && ts.isIdentifier(thenStatement.expression) &&
    thenStatement.expression.originalKeywordKind === undefined &&
    !thenStatement.expression.escapedText) {
    log.push({
      type: LogType.ERROR,
      message: 'Then statement cannot be null in if statement.',
      pos: thenStatement.expression.getStart()
    });
  }
  if (thenStatement) {
    if (ts.isBlock(thenStatement)) {
      thenStatement = processIfBlock(thenStatement, id, log, isBuilder, isGlobalBuilder);
    } else if (ts.isIfStatement(thenStatement)) {
      thenStatement = processInnerIfStatement(thenStatement, 0, log, isBuilder, isGlobalBuilder);
      thenStatement = ts.factory.createBlock(
        partialUpdateConfig.partialUpdateMode
          ? [createIfCreate(), createIfBranchFunc(id, [thenStatement], isGlobalBuilder), createIfPop()]
          : [createIfCreate(), createIfBranchId(id), thenStatement, createIfPop()],
        true
      );
    } else {
      thenStatement = ts.factory.createBlock([thenStatement], true);
      thenStatement = processIfBlock(thenStatement as ts.Block, id, log, isBuilder, isGlobalBuilder);
    }
  }
  return thenStatement;
}

function processElseStatement(elseStatement: ts.Statement, id: number,
  log: LogInfo[], isBuilder: boolean = false, isGlobalBuilder: boolean = false): ts.Statement {
  if (elseStatement) {
    if (ts.isBlock(elseStatement)) {
      elseStatement = processIfBlock(elseStatement, id + 1, log);
    } else if (ts.isIfStatement(elseStatement)) {
      elseStatement = processInnerIfStatement(elseStatement, id + 1, log, isBuilder, isGlobalBuilder);
    } else {
      elseStatement = ts.factory.createBlock([elseStatement], true);
      elseStatement = processIfBlock(elseStatement as ts.Block, id + 1, log, isBuilder, isGlobalBuilder);
    }
  } else if (partialUpdateConfig.partialUpdateMode) {
    elseStatement = ts.factory.createBlock([
      ts.factory.createExpressionStatement(ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createThis(),
          ts.factory.createIdentifier(IFELSEBRANCHUPDATEFUNCTION)
        ),
        undefined,
        [
          ts.factory.createNumericLiteral(++id),
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createBlock(
              [],
              true
            )
          )
        ]
      ))
    ], true);
  }
  return elseStatement;
}

function processIfBlock(block: ts.Block, id: number, log: LogInfo[], isBuilder: boolean = false,
  isGlobalBuilder: boolean = false): ts.Block {
  return addIfBranchId(id, isGlobalBuilder,
    processComponentBlock(block, false, log, false, isBuilder, COMPONENT_IF, undefined, isGlobalBuilder));
}

function addIfBranchId(id: number, isGlobalBuilder: boolean = false, container: ts.Block): ts.Block {
  let containerStatements: ts.Statement[];
  if (partialUpdateConfig.partialUpdateMode) {
    containerStatements = [createIfBranchFunc(id, [...container.statements], isGlobalBuilder)];
  } else {
    containerStatements = [createIfBranchId(id), ...container.statements];
  }
  return ts.factory.updateBlock(container, containerStatements);
}

function createIf(): ts.Identifier {
  return ts.factory.createIdentifier(COMPONENT_IF);
}

function createIfCreate(): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(createFunction(createIf(),
    ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION), ts.factory.createNodeArray([])));
}

function createIfPop(): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(createFunction(createIf(),
    ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null));
}

function createIfBranchId(id: number): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(createFunction(createIf(),
    ts.factory.createIdentifier(COMPONENT_IF_BRANCH_ID_FUNCTION),
    ts.factory.createNodeArray([ts.factory.createNumericLiteral(id)])));
}

function createIfBranchFunc(id: number, innerStatements: ts.Statement[],
  isGlobalBuilder: boolean = false): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(
    isGlobalBuilder ? parentConditionalExpression() : ts.factory.createThis(),
    ts.factory.createIdentifier(IFELSEBRANCHUPDATEFUNCTION)), undefined,
  [ts.factory.createNumericLiteral(id), ts.factory.createArrowFunction(undefined, undefined, [], undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.factory.createBlock(innerStatements, true))]));
}

interface CreateResult {
  newNode: ts.ExpressionStatement;
  identifierNode: ts.Identifier;
  isContainerComponent: boolean;
  isButton: boolean;
  needPop: boolean;
}

function createComponent(node: ts.ExpressionStatement, type: string): CreateResult {
  const res: CreateResult = {
    newNode: node,
    identifierNode: null,
    isContainerComponent: false,
    isButton: false,
    needPop: false
  };
  let identifierNode: ts.Identifier = ts.factory.createIdentifier(type);
  let temp: any = node.expression;
  while (temp && !ts.isIdentifier(temp) && temp.expression) {
    temp = temp.expression;
  }
  if (temp && temp.parent && (ts.isCallExpression(temp.parent) ||
    ts.isEtsComponentExpression(temp.parent)) && ts.isIdentifier(temp)) {
    if (temp.getText() === COMPONENT_BUTTON && type !== COMPONENT_POP_FUNCTION) {
      res.isButton = true;
      identifierNode = type === COMPONENT_CREATE_CHILD_FUNCTION
        ? ts.factory.createIdentifier(COMPONENT_CREATE_CHILD_FUNCTION)
        : ts.factory.createIdentifier(COMPONENT_CREATE_LABEL_FUNCTION);
    }
    if (NEEDPOP_COMPONENT.has(temp.getText())) {
      res.needPop = true;
    }
    if (checkContainer(temp.getText(), temp.parent)) {
      res.isContainerComponent = true;
    }
    res.newNode = type === COMPONENT_POP_FUNCTION
      ? ts.factory.createExpressionStatement(createFunction(temp, identifierNode, null))
      : ts.factory.createExpressionStatement(createFunction(temp, identifierNode, checkArguments(temp, type)));
    res.identifierNode = temp;
  }
  return res;
}

function checkArguments(temp: ts.Identifier, type: string): ts.Expression[] {
  const newArguments: ts.Expression[] = [];
  if (CUSTOM_BUILDER_CONSTRUCTORS.has(temp.escapedText.toString())) {
    temp.parent.arguments.forEach(argument => {
      if (ts.isConditionalExpression(argument)) {
        newArguments.push(processConditionalBuilder(argument, temp, type));
      } else if (isBuilderChangeNode(argument, temp, type)) {
        newArguments.push(parseBuilderNode(argument, type));
      } else {
        newArguments.push(argument);
      }
    });
    return newArguments;
  }
  return temp.getText() === 'XComponent' && type === COMPONENT_CREATE_FUNCTION &&
    projectConfig.moduleName && projectConfig.bundleName ?
    // @ts-ignore
    temp.parent.arguments.concat([
      ts.factory.createStringLiteral(`${projectConfig.bundleName}/${projectConfig.moduleName}`)
    ]) : temp.parent.arguments
}

function checkContainer(name: string, node: ts.Node): boolean {
  return BUILDIN_CONTAINER_COMPONENT.has(name) && (name !== 'XComponent' ||
    (node && node.arguments && node.arguments.length &&
    ts.isObjectLiteralExpression(node.arguments[0]) && node.arguments[0].properties &&
    checkComponentType(node.arguments[0].properties)));
}

function checkComponentType(properties: ts.PropertyAssignment[]): boolean {
  let flag: boolean = false;
  properties.forEach(item => {
    if (isXComponentContainer(item)) {
      flag = true;
    }
  });
  return flag;
}

function isXComponentContainer(item: ts.PropertyAssignment): boolean {
  return item.name && ts.isIdentifier(item.name) && item.name.getText() === RESOURCE_NAME_TYPE &&
    item.initializer && ((ts.isStringLiteral(item.initializer) &&
    // value = 'component'
    (item.initializer.getText() === XCOMPONENT_SINGLE_QUOTATION ||
    item.initializer.getText() === XCOMPONENT_DOUBLE_QUOTATION)) ||
    // value = 1
    (ts.isNumericLiteral(item.initializer) && item.initializer.getText() === '1') ||
    // value = XComponentType.COMPONENT
    (ts.isPropertyAccessExpression(item.initializer) && item.initializer.expression &&
    ts.isIdentifier(item.initializer.expression) && item.initializer.name &&
    ts.isIdentifier(item.initializer.name) && item.initializer.expression.getText() === XCOMPONENTTYPE) &&
    item.initializer.name.getText() === XCOMPONENTTYPE_CONTAINER);
}

interface AnimationInfo {
  statement: ts.Statement,
  kind: boolean,
  hasAnimationAttr: boolean,
}

export interface ComponentAttrInfo {
  reuseId: ts.Node
}

export function bindComponentAttr(node: ts.ExpressionStatement, identifierNode: ts.Identifier,
  newStatements: ts.Statement[], log: LogInfo[], reverse: boolean = true,
  isStylesAttr: boolean = false, newImmutableStatements: ts.Statement[] = null,
  isStyleFunction: boolean = false, componentAttrInfo: ComponentAttrInfo = null): void {
  let temp: any = node.expression;
  const statements: ts.Statement[] = [];
  const immutableStatements: ts.Statement[] = [];
  const updateStatements: ts.Statement[] = [];
  const lastStatement: AnimationInfo = {
    statement: null,
    kind: false,
    hasAnimationAttr: false,
  };
  const isRecycleComponent: boolean = isRecycle(componentCollection.currentClassName);
  if (ts.isPropertyAccessExpression(temp)) {
    log.push({
      type: LogType.ERROR,
      message: `'${node.getText()}' does not meet UI component syntax.`,
      pos: node.getStart()
    });
  }
  while (temp && ts.isCallExpression(temp) && temp.expression) {
    let flag: boolean = false;
    if (temp.expression && (validatePropertyAccessExpressionWithCustomBuilder(temp.expression) ||
      validateIdentifierWithCustomBuilder(temp.expression))) {
      let propertyName: string = '';
      if (ts.isIdentifier(temp.expression)) {
        propertyName = temp.expression.escapedText.toString();
      } else if (ts.isPropertyAccessExpression(temp.expression)) {
        propertyName = temp.expression.name.escapedText.toString();
      }
      switch (true) {
        case BIND_POPUP_SET.has(propertyName):
          temp = processBindPopupBuilder(temp);
          break;
        case BIND_DRAG_SET.has(propertyName):
          temp = processDragStartBuilder(temp, propertyName);
          break;
        default:
          temp = processCustomBuilderProperty(temp, identifierNode, propertyName);
      }
      flag = true;
    }
    if (ts.isPropertyAccessExpression(temp.expression) &&
      temp.expression.name && ts.isIdentifier(temp.expression.name) &&
      !componentCollection.customComponents.has(temp.expression.name.getText())) {
      parseRecycleId(temp, temp.expression.name, isRecycleComponent, componentAttrInfo);
      addComponentAttr(temp, temp.expression.name, lastStatement, statements, identifierNode, log,
        isStylesAttr, immutableStatements, updateStatements, newImmutableStatements,
        isRecycleComponent, isStyleFunction);
      temp = temp.expression.expression;
      flag = true;
    } else if (ts.isIdentifier(temp.expression)) {
      if (!INNER_COMPONENT_NAMES.has(temp.expression.getText()) &&
        !GESTURE_TYPE_NAMES.has(temp.expression.getText()) &&
        !componentCollection.customComponents.has(temp.expression.getText())) {
        parseRecycleId(temp, temp.expression.name, isRecycleComponent, componentAttrInfo);
        addComponentAttr(temp, temp.expression, lastStatement, statements, identifierNode, log,
          isStylesAttr, immutableStatements, updateStatements, newImmutableStatements,
          isRecycleComponent, isStyleFunction);
      }
      break;
    }
    if (!flag) {
      temp = temp.expression;
    }
  }
  if (lastStatement.statement && lastStatement.kind) {
    statements.push(lastStatement.statement);
  }
  if (!isRecycleComponent || lastStatement.hasAnimationAttr) {
    if (statements.length) {
      reverse ? newStatements.push(...statements.reverse()) : newStatements.push(...statements);
    }
  } else {
    if (updateStatements.length) {
      reverse ? newStatements.push(...updateStatements.reverse()) : newStatements.push(...updateStatements);
    }
    if (newImmutableStatements && immutableStatements.length) {
      reverse ? newImmutableStatements.push(...immutableStatements.reverse()) : newImmutableStatements.push(...immutableStatements);
    }
  }
}

function parseRecycleId(node: ts.CallExpression, attr: ts.Identifier, isRecycleComponent: boolean,
  componentAttrInfo: ComponentAttrInfo): void {
  if (componentAttrInfo && attr.escapedText.toString() === RECYCLE_REUSE_ID) {
    componentAttrInfo.reuseId = node.arguments[0];
  }
}

function processCustomBuilderProperty(node: ts.CallExpression, identifierNode: ts.Identifier,
  propertyName: string): ts.CallExpression {
  const newArguments: ts.Expression[] = [];
  node.arguments.forEach((argument: ts.Expression | ts.Identifier, index: number) => {
    if (ts.isConditionalExpression(argument)) {
      newArguments.push(processConditionalBuilder(argument, identifierNode, propertyName));
    } else if (isBuilderChangeNode(argument, identifierNode, propertyName)) {
      newArguments.push(parseBuilderNode(argument, propertyName));
    } else {
      newArguments.push(argument);
    }
  });
  node = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, newArguments);
  return node;
}

function isBuilderChangeNode(argument: ts.Node, identifierNode: ts.Identifier, propertyName: string): boolean {
  return ts.isPropertyAccessExpression(argument) && argument.name && ts.isIdentifier(argument.name)
    && CUSTOM_BUILDER_METHOD.has(argument.name.getText()) ||
    ts.isCallExpression(argument) && argument.expression && argument.expression.name &&
    ts.isIdentifier(argument.expression.name) &&
    CUSTOM_BUILDER_METHOD.has(argument.expression.name.getText()) || ts.isIdentifier(argument) &&
    argument.escapedText && CUSTOM_BUILDER_METHOD.has(argument.escapedText.toString()) ||
    ts.isObjectLiteralExpression(argument) && (BIND_OBJECT_PROPERTY.get(identifierNode.escapedText.toString()) &&
    BIND_OBJECT_PROPERTY.get(identifierNode.escapedText.toString()).has(propertyName) ||
    BIND_OBJECT_PROPERTY.get(ALL_COMPONENTS).has(propertyName)) ||
    ts.isCallExpression(argument) && argument.expression && ts.isIdentifier(argument.expression) &&
    CUSTOM_BUILDER_METHOD.has(argument.expression.escapedText.toString());
}

function parseBuilderNode(node: ts.Node, propertyName: string):
  ts.ObjectLiteralExpression | ts.CallExpression | ts.ArrowFunction {
  if (isPropertyAccessExpressionNode(node)) {
    if (CUSTOM_BUILDER_PROPERTIES_WITHOUTKEY.has(propertyName)) {
      return processPropertyBuilderWithoutKey(node as ts.PropertyAccessExpression);
    } else {
      return processPropertyBuilder(node as ts.PropertyAccessExpression);
    }
  } else if (ts.isIdentifier(node) && CUSTOM_BUILDER_METHOD.has(node.escapedText.toString())) {
    if (CUSTOM_BUILDER_PROPERTIES_WITHOUTKEY.has(propertyName)) {
      return processIdentifierBuilderWithoutKey(node);
    } else {
      return processIdentifierBuilder(node);
    }
  } else if (ts.isCallExpression(node)) {
    if (CUSTOM_BUILDER_PROPERTIES_WITHOUTKEY.has(propertyName)) {
      return getParsedBuilderAttrArgumentWithParamsWithoutKey(node);
    } else {
      return getParsedBuilderAttrArgumentWithParams(node);
    }
  } else if (ts.isObjectLiteralExpression(node)) {
    return processObjectPropertyBuilder(node);
  }
}

export function processObjectPropertyBuilder(node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
  const newProperties: ts.PropertyAssignment[] = [];
  node.properties.forEach((property: ts.PropertyAssignment) => {
    if (property.name && ts.isIdentifier(property.name) &&
      [CUSTOM_DIALOG_CONTROLLER_BUILDER, HEADER, FOOTER, START, END, PREVIEW,TITLE].includes(
        property.name.escapedText.toString()) && property.initializer) {
      if (isPropertyAccessExpressionNode(property.initializer) || ts.isIdentifier(property.initializer) &&
        CUSTOM_BUILDER_METHOD.has(property.initializer.escapedText.toString())) {
        newProperties.push(ts.factory.updatePropertyAssignment(property, property.name,
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              property.initializer,
              ts.factory.createIdentifier(BUILDER_ATTR_BIND)
            ),
            undefined,
            [ts.factory.createThis()]
          )));
      } else if (isGlobalBuilderCallExpressionNode(property.initializer) ||
        isInnerBuilderCallExpressionNode(property.initializer)) {
        newProperties.push(transformBuilderCallExpression(property));
      } else if (ts.isObjectLiteralExpression(property.initializer)) {
        newProperties.push(ts.factory.updatePropertyAssignment(property, property.name,
          processObjectPropertyBuilder(property.initializer)));
      } else {
        newProperties.push(property);
      }
    } else {
      newProperties.push(property);
    }
  });
  return ts.factory.updateObjectLiteralExpression(node, newProperties);
}

function transformBuilderCallExpression(property: ts.PropertyAssignment): ts.PropertyAssignment {
  return ts.factory.updatePropertyAssignment(property, property.name,
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        property.initializer.expression,
        ts.factory.createIdentifier(BUILDER_ATTR_BIND)
      ),
      undefined,
      [ts.factory.createThis(), ...(property.initializer.arguments || [])]
    ));
}

function isInnerBuilderCallExpressionNode(node: ts.Node): boolean {
  return ts.isCallExpression(node) && node.expression && isPropertyAccessExpressionNode(node.expression);
}

function isGlobalBuilderCallExpressionNode(node: ts.Node): boolean {
  return ts.isCallExpression(node) && node.expression && ts.isIdentifier(node.expression) &&
    CUSTOM_BUILDER_METHOD.has(node.expression.escapedText.toString());
}

function isPropertyAccessExpressionNode(node: ts.Node): boolean {
  return ts.isPropertyAccessExpression(node) && node.expression &&
    node.expression.kind === ts.SyntaxKind.ThisKeyword && node.name && ts.isIdentifier(node.name) &&
    CUSTOM_BUILDER_METHOD.has(node.name.escapedText.toString());
}

function processBindPopupBuilder(node: ts.CallExpression): ts.CallExpression {
  const newArguments: ts.Expression[] = [];
  node.arguments.forEach((argument: ts.ObjectLiteralExpression, index: number) => {
    if (index === 1) {
      // @ts-ignore
      newArguments.push(processBindPopupBuilderProperty(argument));
    } else {
      newArguments.push(argument);
    }
  });
  node = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, newArguments);
  return node;
}

function processDragStartBuilder(node: ts.CallExpression, propertyName: string): ts.CallExpression {
  const newStatements: ts.Statement[] = [];
  if (isNodeFunction(node)) {
    // @ts-ignore
    for (let i = 0; i < node.arguments[0].body.statements.length; i++) {
      // @ts-ignore
      const statement: ts.Statement = node.arguments[0].body.statements[i];
      newStatements.push(checkStatement(statement, propertyName));
    }
    node = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [ts.factory.updateArrowFunction(
      // @ts-ignore
      node.arguments[0], undefined, undefined, node.arguments[0].parameters, node.arguments[0].type,
      // @ts-ignore
      node.arguments[0].equalsGreaterThanToken, ts.factory.updateBlock(node.arguments[0].body, newStatements))]);
  }
  return node;
}

function isNodeFunction(node: ts.CallExpression): boolean {
  return node.arguments && node.arguments.length && ts.isArrowFunction(node.arguments[0]) && node.arguments[0].body &&
    ts.isBlock(node.arguments[0].body);
}

function checkStatement(statement: ts.Statement, propertyName: string): ts.Statement {
  if (ts.isReturnStatement(statement)) {
    if (ts.isObjectLiteralExpression(statement.expression)) {
      const newProperties: ts.ObjectLiteralElementLike[] = [];
      for (let j = 0; j < statement.expression.properties.length; j++) {
        let property: ts.ObjectLiteralElementLike = statement.expression.properties[j];
        property = checkProperty(property, propertyName);
        newProperties.push(property);
      }
      return ts.factory.createReturnStatement(ts.factory.createObjectLiteralExpression(newProperties));
    } else {
      let initializer: ts.Expression = statement.expression;
      initializer = processInitializer(initializer, propertyName);
      return ts.factory.updateReturnStatement(statement, initializer);
    }
  } else {
    return statement;
  }
}

function checkProperty(property: ts.ObjectLiteralElementLike, propertyName: string): ts.ObjectLiteralElementLike {
  if (isPropertyFunction(property)) {
    let initializer: ts.Expression = property.initializer;
    initializer = processInitializer(initializer, propertyName);
    property = ts.factory.createPropertyAssignment(property.name, initializer);
  }
  return property;
}

function processInitializer(initializer: ts.Expression, propertyName: string): ts.Expression {
  if (initializer && ts.isConditionalExpression(initializer)) {
    return processConditionalBuilder(initializer, ts.factory.createIdentifier(CUSTOM_COMPONENT_DEFAULT),
      propertyName);
  } else if (isBuilderChangeNode(initializer, ts.factory.createIdentifier(CUSTOM_COMPONENT_DEFAULT),
    propertyName)) {
    return parseBuilderNode(initializer, propertyName);
  }
  return initializer;
}

function isPropertyFunction(property: ts.ObjectLiteralElementLike): boolean {
  return ts.isPropertyAssignment(property) && property.name && ts.isIdentifier(property.name) &&
    property.name.escapedText.toString() === BUILDER_ATTR_NAME;
}

function processBindPopupBuilderProperty(node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
  const newProperties: ts.PropertyAssignment[] = [];
  node.properties.forEach((property: ts.PropertyAssignment, index: number) => {
    if (property.name && ts.isIdentifier(property.name) && property.initializer &&
      property.name.escapedText.toString() === CUSTOM_DIALOG_CONTROLLER_BUILDER) {
      let initializer: ts.Expression = property.initializer;
      initializer = processInitializer(initializer, BIND_POPUP);
      newProperties.push(ts.factory.updatePropertyAssignment(property, property.name, initializer));
    } else {
      newProperties.push(property);
    }
  });
  return ts.factory.updateObjectLiteralExpression(node, newProperties);
}

function processConditionalBuilder(initializer: ts.ConditionalExpression, identifierNode: ts.Identifier,
  propertyName: string): ts.ConditionalExpression {
  let whenTrue: ts.Expression = initializer.whenTrue;
  let whenFalse: ts.Expression = initializer.whenFalse;
  if (isBuilderChangeNode(initializer.whenTrue, identifierNode, propertyName)) {
    whenTrue = parseBuilderNode(initializer.whenTrue, propertyName);
  }
  if (isBuilderChangeNode(initializer.whenFalse, identifierNode, propertyName)) {
    whenFalse = parseBuilderNode(initializer.whenFalse, propertyName);
  }
  return ts.factory.createConditionalExpression(
    initializer.condition,
    initializer.questionToken,
    whenTrue,
    initializer.colonToken,
    whenFalse
  );
}

function processPropertyBuilder(node: ts.PropertyAccessExpression): ts.ObjectLiteralExpression {
  return ts.factory.createObjectLiteralExpression([
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier(BUILDER_ATTR_NAME),
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          node,
          ts.factory.createIdentifier(BUILDER_ATTR_BIND)
        ),
        undefined,
        [ts.factory.createThis()]
      )
    )
  ]);
}

function processPropertyBuilderWithoutKey(node: ts.PropertyAccessExpression): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      node,
      ts.factory.createIdentifier(BUILDER_ATTR_BIND)
    ),
    undefined,
    [ts.factory.createThis()]
  );
}

function processIdentifierBuilder(node: ts.Identifier): ts.ObjectLiteralExpression {
  return ts.factory.createObjectLiteralExpression([
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier(BUILDER_ATTR_NAME),
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(node, ts.factory.createIdentifier(BUILDER_ATTR_BIND)),
        undefined, [ts.factory.createThis()]
      )
    )
  ]);
}

function processIdentifierBuilderWithoutKey(node: ts.Identifier): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(node, ts.factory.createIdentifier(BUILDER_ATTR_BIND)),
    undefined, [ts.factory.createThis()]
  );
}

function getParsedBuilderAttrArgumentWithParams(node: ts.CallExpression):
  ts.ObjectLiteralExpression {
  return ts.factory.createObjectLiteralExpression([
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier(BUILDER_ATTR_NAME),
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock(
          [ts.factory.createExpressionStatement(ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(node.expression, ts.factory.createIdentifier(CALL)
            ), undefined, [ts.factory.createThis(), ...node.arguments]))],
          true
        )
      )
    )
  ]);
}

function getParsedBuilderAttrArgumentWithParamsWithoutKey(node: ts.CallExpression):
  ts.ArrowFunction {
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock(
      [ts.factory.createExpressionStatement(ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(node.expression, ts.factory.createIdentifier(CALL)
        ), undefined, [ts.factory.createThis(), ...node.arguments]))],
      true
    )
  );
}

function validatePropertyAccessExpressionWithCustomBuilder(node: ts.Node): boolean {
  return ts.isPropertyAccessExpression(node) && node.name &&
    ts.isIdentifier(node.name) && CUSTOM_BUILDER_PROPERTIES.has(node.name.escapedText.toString());
}

function validateIdentifierWithCustomBuilder(node: ts.Node): boolean {
  return ts.isIdentifier(node) && CUSTOM_BUILDER_PROPERTIES.has(node.escapedText.toString());
}

function createArrowFunctionFor$$($$varExp: ts.Expression): ts.ArrowFunction {
  return ts.factory.createArrowFunction(
    undefined, undefined,
    [ts.factory.createParameterDeclaration(
      undefined, undefined,
      ts.factory.createIdentifier($$_NEW_VALUE),
      undefined, undefined, undefined
    )],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock(
      [ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
        $$varExp,
        ts.factory.createToken(ts.SyntaxKind.EqualsToken),
        ts.factory.createIdentifier($$_NEW_VALUE)
      ))],
      false
    )
  );
}

function updateArgumentFor$$(argument: any): ts.Expression {
  if (ts.isElementAccessExpression(argument)) {
    return ts.factory.updateElementAccessExpression(
      argument, updateArgumentFor$$(argument.expression), argument.argumentExpression);
  } else if (ts.isIdentifier(argument)) {
    props.push(argument.getText());
    if (argument.getText() === $$_THIS) {
      return ts.factory.createThis();
    } else if (argument.getText().match(/^\$\$(.|\n)+/)) {
      return ts.factory.createIdentifier(argument.getText().replace(/\$\$/, ''));
    }
  } else if (ts.isPropertyAccessExpression(argument)) {
    return ts.factory.updatePropertyAccessExpression(
      argument, updateArgumentFor$$(argument.expression), argument.name);
  }
}

function verifyComponentId(temp: any, node: ts.Identifier, propName: string,
  log: LogInfo[]): void {
  if (!newsupplement.isAcceleratePreview && propName === ATTRIBUTE_ID &&
    ts.isStringLiteral(temp.arguments[0])) {
    const id: string = temp.arguments[0].text;
    const posOfNode: ts.LineAndCharacter = transformLog.sourceFile
      .getLineAndCharacterOfPosition(getRealNodePos(node));
    const curFileName: string = transformLog.sourceFile.fileName.replace(/\.ts$/, '');
    const rPath: string = path.resolve(projectConfig.projectPath, curFileName)
      .replace(/\\+/g, '/');
    const rLine: number = posOfNode.line + 1;
    const rCol: number = posOfNode.character + 1;
    if (ID_ATTRS.has(id)) {
      const idInfo: Map<string, string | number> = ID_ATTRS.get(id);
      if (!(idInfo.get('path') === rPath &&
        idInfo.get('line') === rLine &&
        idInfo.get('col') === rCol)) {
        log.push({
          type: LogType.WARN,
          message: `The current component id "${id}" is duplicate with ` +
            `${idInfo.get('path')}:${idInfo.get('line')}:${idInfo.get('col')}.`,
          pos: node.pos
        });
      }
    } else {
      ID_ATTRS.set(id, new Map().set('path', rPath)
        .set('line', rLine)
        .set('col', rCol));
    }
  }
}

function addComponentAttr(temp: any, node: ts.Identifier, lastStatement: any,
  statements: ts.Statement[], identifierNode: ts.Identifier, log: LogInfo[],
  isStylesAttr: boolean, immutableStatements: ts.Statement[], updateStatements: ts.Statement[],
  newImmutableStatements: ts.Statement[] = null, isRecycleComponent: boolean = false,
  isStyleFunction: boolean = false): void {
  const propName: string = node.getText();
  verifyComponentId(temp, node, propName, log);
  const extendType: ExtendType = {type: ''};
  if (propName === ATTRIBUTE_ANIMATION) {
    const animationNullNode: ts.ExpressionStatement = ts.factory.createExpressionStatement(
      createFunction(ts.factory.createIdentifier(GLOBAL_CONTEXT), node,
        // @ts-ignore
        [ts.factory.createNull()]));
    if (!lastStatement.statement) {
      if (!(temp.arguments.length === 1 &&
        temp.arguments[0].kind === ts.SyntaxKind.NullKeyword)) {
        statements.push(animationNullNode);
      }
    } else {
      statements.push(lastStatement.statement, animationNullNode);
    }
    lastStatement.statement = ts.factory.createExpressionStatement(createFunction(
      ts.factory.createIdentifier(GLOBAL_CONTEXT), node, temp.arguments));
    lastStatement.kind = false;
    lastStatement.hasAnimationAttr = true;
  } else if (GESTURE_ATTRS.has(propName)) {
    parseGesture(temp, propName, statements, log, updateStatements);
    lastStatement.kind = true;
  } else if (isExtendFunctionNode(identifierNode, propName, extendType)) {
    if (newsupplement.isAcceleratePreview) {
      log.push({
        type: LogType.ERROR,
        message: `Doesn't support Extend function now`,
        pos: temp.getStart()
      });
    }
    let functionName: string = '';
    if (extendType.type === CHECK_COMPONENT_EXTEND_DECORATOR) {
      functionName = `__${identifierNode.escapedText.toString()}__${propName}`;
    } else {
      functionName = propName;
    }
    const extendNode: ts.Statement = ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(ts.factory.createIdentifier(functionName), undefined,
      extendType.type === CHECK_COMPONENT_EXTEND_DECORATOR
        ? temp.arguments
        : [
            ...temp.arguments, ts.factory.createIdentifier(ELMTID),
            ts.factory.createIdentifier(ISINITIALRENDER),
            ts.factory.createThis()
          ]
      ));
    statements.push(extendNode);
    updateStatements.push(extendNode);
    lastStatement.kind = true;
  } else if (propName === ATTRIBUTE_STATESTYLES) {
    if (temp.arguments.length === 1 && ts.isObjectLiteralExpression(temp.arguments[0])) {
      statements.push(createViewStackProcessor(temp, true));
      if (isRecycleComponent) {
        updateStatements.push(createViewStackProcessor(temp, true));
      }
      traverseStateStylesAttr(temp, statements, identifierNode, log, updateStatements,
        newImmutableStatements, isRecycleComponent);
      lastStatement.kind = true;
    } else {
      validateStateStyleSyntax(temp, log);
    }
  } else if (GLOBAL_STYLE_FUNCTION.has(propName) || INNER_STYLE_FUNCTION.has(propName)) {
    const styleBlock: ts.Block =
        INNER_STYLE_FUNCTION.get(propName) || GLOBAL_STYLE_FUNCTION.get(propName);
    if (styleBlock.statements.length > 0) {
      bindComponentAttr(styleBlock.statements[0] as ts.ExpressionStatement, identifierNode,
        statements, log, false, true, newImmutableStatements);
      if (isRecycleComponent) {
        bindComponentAttr(styleBlock.statements[0] as ts.ExpressionStatement, identifierNode,
          updateStatements, log, false, true, newImmutableStatements, true);
      }
    }
    lastStatement.kind = true;
  } else if (isDoubleDollarToChange(isStylesAttr, identifierNode, propName, temp)) {
    const argumentsArr: ts.Expression[] = [];
    classifyArgumentsNum(temp.arguments, argumentsArr, propName, identifierNode);
    const doubleDollarNode: ts.Statement = ts.factory.createExpressionStatement(
      createFunction(identifierNode, node, argumentsArr));
    statements.push(doubleDollarNode);
    updateStatements.push(doubleDollarNode);
    lastStatement.kind = true;
  } else {
    temp = loopEtscomponent(temp, isStylesAttr);
    if (propName !== RECYCLE_REUSE_ID) {
      let isAttributeModifier: boolean = false;
      if (propName === ATTRIBUTE_ATTRIBUTE_MODIFIER) {
        isAttributeModifier = true;
      }
      const attrStatement: ts.Statement = ts.factory.createExpressionStatement(
        createFunction(identifierNode, node, temp.arguments, isAttributeModifier));
      statements.push(attrStatement);
      if (isRecycleComponent && (!isStylesAttr || isStyleFunction) &&
        !isGestureType(identifierNode) && filterRegularAttrNode(temp.arguments)) {
        immutableStatements.push(attrStatement);
      } else {
        updateStatements.push(attrStatement);
      }
    }
    lastStatement.kind = true;
  }
}

function isGestureType(node: ts.Identifier): boolean {
  return GESTURE_TYPE_NAMES.has(node.escapedText.toString());
}

function filterRegularAttrNode(argumentsNode: ts.NodeArray<ts.Expression>) {
  return argumentsNode.every((argument: ts.Expression) => {
    return isRegularAttrNode(argument);
  });
}

type AttrResult = { isRegularNode: boolean };
function isRegularAttrNode(node: ts.Expression): boolean {
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every((propNode: ts.PropertyAssignment) => {
      if (propNode.initializer) {
        return isRegularAttrNode(propNode.initializer);
      }
      return false;
    });
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every((child: ts.Expression) => {
      return isRegularAttrNode(child);
    });
  }
  // literal e.g. 'hello', 1, true, false, () => {}
  if (isLiteralNode(node)) {
    return true;
  }
  // enum e.g. Color.Red
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) &&
    ts.isIdentifier(node.name)) {
    if (enumCollection.has(node.expression.escapedText.toString())) {
      return true;
    }
    if (globalProgram.checker) {
      const type: ts.Type = globalProgram.checker.getTypeAtLocation(node);
      /* Enum */
      if (type.flags & (32 | 1024)) {
        return true;
      }
    }
    return false;
  }
  // regular variable, e.g. this.regularValue
  const result: AttrResult = { isRegularNode: false };
  if (ts.isPropertyAccessExpression(node)) {
    traversePropNode(node, result);
  }
  return result.isRegularNode || false;
}

function isLiteralNode(node: ts.Expression): boolean {
  return ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isArrowFunction(node) ||
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(node.kind);
}

function traversePropNode(node: ts.PropertyAccessExpression, result: AttrResult): void {
  if (node.expression.kind === ts.SyntaxKind.ThisKeyword && ts.isIdentifier(node.name) &&
    regularCollection.get(componentCollection.currentClassName).has(node.name.escapedText.toString())) {
    result.isRegularNode = true;
    return;
  }
  if (ts.isPropertyAccessExpression(node.expression)) {
    traversePropNode(node.expression, result);
  }
}

function isDoubleDollarToChange(isStylesAttr: boolean, identifierNode: ts.Identifier,
  propName: string, temp: any): boolean {
  return !isStylesAttr &&
    PROPERTIES_ADD_DOUBLE_DOLLAR.has(identifierNode.escapedText.toString()) &&
    PROPERTIES_ADD_DOUBLE_DOLLAR.get(identifierNode.escapedText.toString()).has(propName) ||
    STYLE_ADD_DOUBLE_DOLLAR.has(propName) && temp.arguments.length && temp.arguments[0] ?
    temp.arguments[0].getText().match(/^\$\$(.|\n)+/) !== null
    : false;
}

function processDollarEtsComponent(node: ts.EtsComponentExpression, name: string
): ts.EtsComponentExpression {
  node.arguments.forEach((item: ts.Node, index: number) => {
    if (ts.isObjectLiteralExpression(item) && item.properties && item.properties.length) {
      item.properties.forEach((param: ts.PropertyAssignment, paramIndex: number) => {
        if (isHaveDoubleDollar(param, name)) {
          const varExp: ts.Expression = updateArgumentFor$$(param.initializer);
          node.arguments[index].properties[paramIndex].initializer = generateObjectFor$$(varExp);
        }
      });
    }
  });
  return node;
}

function isHaveDoubleDollar(param: ts.PropertyAssignment, name: string): boolean {
  return ts.isPropertyAssignment(param) && param.name && ts.isIdentifier(param.name) &&
    PROPERTIES_ADD_DOUBLE_DOLLAR.get(name).has(param.name.getText()) && param.initializer &&
    param.initializer.getText().startsWith($$);
}

function loopEtscomponent(node: any, isStylesAttr: boolean): ts.Node {
  node.arguments.forEach((item: ts.Node, index: number) => {
    if (ts.isEtsComponentExpression(item)) {
      node.arguments[index] = ts.factory.createCallExpression(
        item.expression, undefined, item.arguments);
    } else if ((ts.isCallExpression(item) || ts.isNewExpression(item)) &&
      !newsupplement.isAcceleratePreview) {
      node.arguments[index] = ts.visitEachChild(item,
        changeEtsComponentKind, contextGlobal);
    }
  });
  return node;
}

function changeEtsComponentKind(node: ts.Node): ts.Node {
  if (ts.isEtsComponentExpression(node)) {
    node.kind = 204;
    return node;
  }
  return ts.visitEachChild(node, changeEtsComponentKind, contextGlobal);
}

function classifyArgumentsNum(args: any, argumentsArr: ts.Expression[], propName: string,
  identifierNode: ts.Identifier): void {
  if (STYLE_ADD_DOUBLE_DOLLAR.has(propName) && args.length >= 2) {
    const varExp: ts.Expression = updateArgumentFor$$(args[0]);
    argumentsArr.push(generateObjectFor$$(varExp), ...args.slice(1));
  } else if (PROPERTIES_ADD_DOUBLE_DOLLAR.has(identifierNode.getText()) && args.length === 1 &&
    PROPERTIES_ADD_DOUBLE_DOLLAR.get(identifierNode.getText()).has(propName) ||
    STYLE_ADD_DOUBLE_DOLLAR.has(propName) && args.length === 1) {
    const varExp: ts.Expression = updateArgumentFor$$(args[0]);
    argumentsArr.push(varExp, createArrowFunctionFor$$(varExp));
  }
}

function generateObjectFor$$(varExp: ts.Expression): ts.ObjectLiteralExpression {
  return ts.factory.createObjectLiteralExpression(
    [
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier($$_VALUE),
        varExp
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier($$_CHANGE_EVENT),
        createArrowFunctionFor$$(varExp)
      )
    ],
    false
  );
}

function createViewStackProcessor(item: any, endViewStack: boolean): ts.ExpressionStatement {
  const argument: ts.StringLiteral[] = [];
  if (!endViewStack && item.name) {
    argument.push(ts.factory.createStringLiteral(item.name.getText()));
  }
  return ts.factory.createExpressionStatement(ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(VIEW_STACK_PROCESSOR),
      ts.factory.createIdentifier(VISUAL_STATE)
    ),
    undefined,
    argument
  ));
}

function traverseStateStylesAttr(temp: any, statements: ts.Statement[],
  identifierNode: ts.Identifier, log: LogInfo[], updateStatements: ts.Statement[],
  newImmutableStatements: ts.Statement[] = null, isRecycleComponent: boolean = false): void {
  temp.arguments[0].properties.reverse().forEach((item: ts.PropertyAssignment) => {
    if (ts.isPropertyAccessExpression(item.initializer) &&
      item.initializer.expression.getText() === THIS &&
      INNER_STYLE_FUNCTION.get(item.initializer.name.getText())) {
      const name: string = item.initializer.name.getText();
      bindComponentAttr(INNER_STYLE_FUNCTION.get(name).statements[0] as ts.ExpressionStatement,
        identifierNode, statements, log, false, true, newImmutableStatements);
      if (isRecycleComponent) {
        bindComponentAttr(INNER_STYLE_FUNCTION.get(name).statements[0] as ts.ExpressionStatement,
          identifierNode, updateStatements, log, false, true, newImmutableStatements);
      }
    } else if (ts.isIdentifier(item.initializer) &&
      GLOBAL_STYLE_FUNCTION.get(item.initializer.getText())) {
      const name: string = item.initializer.getText();
      bindComponentAttr(GLOBAL_STYLE_FUNCTION.get(name).statements[0] as ts.ExpressionStatement,
        identifierNode, statements, log, false, true, newImmutableStatements);
      if (isRecycleComponent) {
        bindComponentAttr(GLOBAL_STYLE_FUNCTION.get(name).statements[0] as ts.ExpressionStatement,
          identifierNode, updateStatements, log, false, true, newImmutableStatements);
      }
    } else if (ts.isObjectLiteralExpression(item.initializer) &&
      item.initializer.properties.length === 1 &&
      ts.isPropertyAssignment(item.initializer.properties[0])) {
      bindComponentAttr(ts.factory.createExpressionStatement(
        item.initializer.properties[0].initializer), identifierNode, statements, log, false, true,
        newImmutableStatements);
      if (isRecycleComponent) {
        bindComponentAttr(ts.factory.createExpressionStatement(
          item.initializer.properties[0].initializer), identifierNode, updateStatements, log, false, true,
          newImmutableStatements);
      }
    } else {
      if (!(ts.isObjectLiteralExpression(item.initializer) && item.initializer.properties.length === 0)) {
        validateStateStyleSyntax(temp, log);
      }
    }
    if (item.name) {
      const viewNode: ts.Statement = createViewStackProcessor(item, false);
      statements.push(viewNode);
      if (isRecycleComponent) {
        updateStatements.push(viewNode);
      }
    }
  });
}

interface ExtendType {
  type: string
}

function isExtendFunctionNode(identifierNode: ts.Identifier, propName: string,
  extendType: ExtendType): boolean {
  const componentName: string = identifierNode.escapedText.toString();
  if (EXTEND_ATTRIBUTE.has(componentName) && [...EXTEND_ATTRIBUTE.get(componentName)].includes(propName)) {
    extendType.type = CHECK_COMPONENT_EXTEND_DECORATOR;
    return true;
  }
  const animatableExtendAttribute: Map<string, Set<string>> =
    storedFileInfo.getCurrentArkTsFile().animatableExtendAttribute;
  if (animatableExtendAttribute.has(componentName) &&
    [...animatableExtendAttribute.get(componentName)].includes(propName)) {
    extendType.type = CHECK_COMPONENT_ANIMATABLE_EXTEND_DECORATOR;
    return true;
  }
  return false;
}

const gestureMap: Map<string, string> = new Map([
  [PRIORITY_GESTURE_ATTRIBUTE, GESTURE_ENUM_VALUE_HIGH],
  [PARALLEL_GESTURE_ATTRIBUTE, GESTURE_ENUM_VALUE_PARALLEL],
  [GESTURE_ATTRIBUTE, GESTURE_ENUM_VALUE_LOW]
]);

function parseGesture(node: ts.CallExpression, propName: string, statements: ts.Statement[],
  log: LogInfo[], updateStatements: ts.Statement[]): void {
  const popNode: ts.Statement = ts.factory.createExpressionStatement(
    createFunction(ts.factory.createIdentifier(COMPONENT_GESTURE),
      ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null));
  statements.push(popNode);
  updateStatements.push(popNode);
  parseGestureInterface(node, statements, log, updateStatements);
  const argumentArr: ts.NodeArray<ts.PropertyAccessExpression> = ts.factory.createNodeArray(
    [ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(GESTURE_ENUM_KEY),
      ts.factory.createIdentifier(gestureMap.get(propName)))
    ]
  );
  if (node.arguments && node.arguments.length > 1 &&
    ts.isPropertyAccessExpression(node.arguments[1])) {
    // @ts-ignore
    argumentArr.push(node.arguments[1]);
  }
  const createNode: ts.Statement = ts.factory.createExpressionStatement(
    createFunction(ts.factory.createIdentifier(COMPONENT_GESTURE),
      ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION), argumentArr));
  statements.push(createNode);
  updateStatements.push(createNode);
}

function processGestureType(node: ts.CallExpression, statements: ts.Statement[], log: LogInfo[],
  updateStatements: ts.Statement[], reverse: boolean = false): void {
  const newStatements: ts.Statement[] = [];
  const newNode: ts.ExpressionStatement = ts.factory.createExpressionStatement(node);
  let temp: any = node.expression;
  while (temp && !ts.isIdentifier(temp) && temp.expression) {
    temp = temp.expression;
  }
  if (temp && temp.parent && ts.isCallExpression(temp.parent) && ts.isIdentifier(temp) &&
    GESTURE_TYPE_NAMES.has(temp.escapedText.toString())) {
    newStatements.push(ts.factory.createExpressionStatement(
      createFunction(temp, ts.factory.createIdentifier(COMPONENT_POP_FUNCTION), null)));
    if (temp.escapedText.toString() === COMPONENT_GESTURE_GROUP) {
      const gestureStatements: ts.Statement[] = [];
      parseGestureInterface(temp.parent, gestureStatements, log, updateStatements, true);
      newStatements.push(...gestureStatements.reverse());
      bindComponentAttr(newNode, temp, newStatements, log, false);
      let argumentArr: ts.NodeArray<ts.Expression> = null;
      if (temp.parent.arguments && temp.parent.arguments.length) {
        // @ts-ignore
        argumentArr = ts.factory.createNodeArray([temp.parent.arguments[0]]);
      }
      newStatements.push(ts.factory.createExpressionStatement(
        createFunction(temp, ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION), argumentArr)));
    } else {
      bindComponentAttr(newNode, temp, newStatements, log, false);
      newStatements.push(ts.factory.createExpressionStatement(
        createFunction(temp, ts.factory.createIdentifier(COMPONENT_CREATE_FUNCTION), temp.parent.arguments)));
    }
  }
  if (newStatements.length) {
    reverse ? statements.push(...newStatements.reverse()) : statements.push(...newStatements);
    reverse ? updateStatements.push(...newStatements.reverse()) : updateStatements.push(...newStatements);
  }
}

function parseGestureInterface(node: ts.CallExpression, statements: ts.Statement[], log: LogInfo[],
  updateStatements: ts.Statement[], reverse: boolean = false): void {
  if (node.arguments && node.arguments.length) {
    node.arguments.forEach((item: ts.Node) => {
      if (ts.isCallExpression(item)) {
        processGestureType(item, statements, log, updateStatements, reverse);
      }
    });
  }
}

export function getName(node: ts.ExpressionStatement | ts.Expression): string {
  // @ts-ignore
  let temp: any = node.expression;
  let name: string;
  while (temp) {
    if (ts.isIdentifier(temp) && temp.parent && (ts.isCallExpression(temp.parent) ||
      ts.isEtsComponentExpression(temp.parent))) {
      name = temp.escapedText.toString();
      break;
    } else if (ts.isPropertyAccessExpression(temp) && temp.name && ts.isIdentifier(temp.name) &&
      isCustomAttributes(temp)) {
      name = temp.name.escapedText.toString();
      break;
    }
    temp = temp.expression;
  }
  return name;
}

function isCustomAttributes(temp: ts.PropertyAccessExpression): boolean {
  if (temp.expression && temp.expression.getText() === THIS) {
    return true;
  } else if (temp.expression && ts.isIdentifier(temp.expression) && temp.expression.getText() === $$ &&
    builderTypeParameter.params.includes(temp.expression.getText())) {
    return true;
  } else {
    return !BUILDIN_STYLE_NAMES.has(temp.name.escapedText.toString());
  }
}

export function isAttributeNode(node: ts.ExpressionStatement): boolean {
  let temp: any = node.expression;
  let name: string;
  while (temp) {
    if (ts.isCallExpression(temp) && temp.expression && ts.isIdentifier(temp.expression)) {
      name = temp.expression.escapedText.toString();
      break;
    }
    temp = temp.expression;
  }
  return BUILDIN_STYLE_NAMES.has(name);
}

enum ComponentType {
  innerComponent,
  customComponent,
  forEachComponent,
  customBuilderMethod,
  builderParamMethod,
  function,
  builderTypeFunction
}

function isEtsComponent(node: ts.ExpressionStatement): boolean {
  let isEtsComponent: boolean = false;
  let temp: any = node.expression;
  while (temp) {
    if (ts.isEtsComponentExpression(temp)) {
      isEtsComponent = true;
    }
    temp = temp.expression;
  }
  return isEtsComponent;
}

function isSomeName(forEachParameters: ts.NodeArray<ts.ParameterDeclaration>, name: string): boolean {
  return Array.isArray(forEachParameters) && 
    forEachParameters.some((item)=>{
      return ts.isIdentifier(item.name) ? item.name.escapedText.toString() === name : false;
    });
}

function isParamFunction(node: ts.ExpressionStatement): boolean {
  return node.expression && ts.isCallExpression(node.expression) && 
    node.expression.expression && ts.isIdentifier(node.expression.expression);
}

function getComponentType(node: ts.ExpressionStatement, log: LogInfo[], name: string,
  parent: string, forEachParameters: ts.NodeArray<ts.ParameterDeclaration> = undefined): ComponentType {
  let isBuilderName: boolean = true;
  if (forEachParameters && isSomeName(forEachParameters, name) && isParamFunction(node)) {
    isBuilderName = false;
  }
  if (isEtsComponent(node)) {
    if (componentCollection.customComponents.has(name)) {
      return ComponentType.customComponent;
    } else {
      return ComponentType.innerComponent;
    }
  } else if (componentCollection.customComponents.has(name)) {
    return ComponentType.customComponent;
  } else if (name === COMPONENT_FOREACH || name === COMPONENT_LAZYFOREACH) {
    return ComponentType.forEachComponent;
  } else if (CUSTOM_BUILDER_METHOD.has(name) && isBuilderName) {
    return ComponentType.customBuilderMethod;
  } else if (builderParamObjectCollection.get(componentCollection.currentClassName) &&
    builderParamObjectCollection.get(componentCollection.currentClassName).has(name)) {
    return ComponentType.builderParamMethod;
  } else if (!partialUpdateConfig.builderCheck && builderTypeParameter.params.includes(name) &&
    judgeBuilderType(node)) {
    return ComponentType.builderTypeFunction;
  } else if ((['XComponent'].includes(parent) || CUSTOM_BUILDER_METHOD.has(parent)) &&
    ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
    return ComponentType.function;
  } else if (!isAttributeNode(node)) {
    log.push({
      type: LogType.ERROR,
      message: `'${node.getText()}' does not meet UI component syntax.`,
      pos: node.getStart()
    });
  }
  return null;
}

function judgeBuilderType(node: ts.ExpressionStatement): boolean {
  let checker: ts.TypeChecker;
  if (globalProgram.program) {
    checker = globalProgram.program.getTypeChecker();
  } else if (globalProgram.watchProgram) {
    checker = globalProgram.watchProgram.getCurrentProgram().getProgram().getTypeChecker();
  }
  if (node.expression && node.expression.expression && checker) {
    const type: ts.Type = checker.getTypeAtLocation(node.expression.expression);
    if (type && type.aliasSymbol && type.aliasSymbol.escapedName === BUILDER_TYPE) {
      return true;
    }
  }
  return false;
}

export function validateStateStyleSyntax(temp: any, log: LogInfo[]): void {
  log.push({
    type: LogType.ERROR,
    message: `.stateStyles doesn't conform standard.`,
    pos: temp.getStart()
  });
}

function getEtsComponentExpression(node:ts.ExpressionStatement): ts.EtsComponentExpression {
  let current: any = node.expression;
  while (current) {
    if (ts.isEtsComponentExpression(current)) {
      return current;
    }
    current = current.expression;
  }
  return null;
}

function checkEtsAndIdInIf(node:ts.ExpressionStatement, parent: string): [ts.EtsComponentExpression, ts.Expression] {
  let current: any = node.expression;
  let idName: ts.Expression;
  while (current) {
    if (ts.isEtsComponentExpression(current)) {
      break;
    }
    if (!idName && parent === COMPONENT_IF && ts.isPropertyAccessExpression(current) && current.name &&
      ts.isIdentifier(current.name) && current.name.escapedText.toString() === ATTRIBUTE_ID &&
      current.parent && current.parent.arguments && current.parent.arguments.length) {
      idName = current.parent.arguments[0];
    }
    current = current.expression;
  }
  return [current, idName];
}

function checkIdInIf(node:ts.ExpressionStatement, parent: string): ts.Expression {
  let current: any = node.expression;
  let idName: ts.Expression;
  while (current) {
    if (parent === COMPONENT_IF && ts.isPropertyAccessExpression(current) && current.name &&
      ts.isIdentifier(current.name) && current.name.escapedText.toString() === ATTRIBUTE_ID &&
      current.parent && current.parent.arguments && current.parent.arguments.length) {
      idName = current.parent.arguments[0];
      break;
    }
    current = current.expression;
  }
  return idName;
}

function checkEtsComponent(node: ts.ExpressionStatement, log: LogInfo[]): void {
  const etsComponentExpression: ts.EtsComponentExpression = getEtsComponentExpression(node);
  if (etsComponentExpression) {
    checkAllNode(
      etsComponentExpression,
      new Set([...INNER_COMPONENT_NAMES, ...componentCollection.customComponents]),
      transformLog.sourceFile,
      log
    );
  }
}

function checkButtonParamHasLabel(node: ts.EtsComponentExpression, log: LogInfo[]): void {
  if (node.arguments && node.arguments.length !== 0) {
    for (let i = 0; i < node.arguments.length; i++) {
      let argument: ts.Expression = node.arguments[i];
      if (ts.isStringLiteral(argument) || (ts.isCallExpression(argument) && ts.isIdentifier(argument.expression) &&
        (argument.expression.escapedText.toString() === RESOURCE))) {
        log.push({
          type: LogType.ERROR,
          message: 'The Button component with a label parameter can not have any child.',
          pos: node.getStart()
        });
        return;
      }
    }
  }
}

function isLazyForEachChild(node: ts.ExpressionStatement): boolean {
  let temp: any = node.parent;
  while (temp && !ts.isEtsComponentExpression(temp) && !ts.isCallExpression(temp)) {
    temp = temp.parent;
  }
  if (temp && temp.expression && (temp.expression as ts.Identifier).escapedText.toString() === COMPONENT_LAZYFOREACH) {
    return true;
  }
  return false;
}

export function createFunction(node: ts.Identifier, attrNode: ts.Identifier,
  argumentsArr: ts.NodeArray<ts.Expression>, isAttributeModifier: boolean = false): ts.CallExpression {
  if (argumentsArr && argumentsArr.length) {
    if (checkCreateArgumentBuilder(node, attrNode)) {
      argumentsArr = transformBuilder(argumentsArr);
    }
  } else {
    // @ts-ignore
    argumentsArr = [];
  }
  return ts.factory.createCallExpression(
    isAttributeModifier ? ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createPropertyAccessExpression(
          node,
          attrNode
        ),
        ts.factory.createIdentifier(BUILDER_ATTR_BIND)
      ),
      undefined,
      [ts.factory.createThis()]
    ) : ts.factory.createPropertyAccessExpression(
      node,
      attrNode
    ),
    undefined,
    argumentsArr
  );
}

function checkCreateArgumentBuilder(node: ts.Identifier, attrNode: ts.Identifier): boolean {
  if (attrNode.escapedText.toString() === COMPONENT_CREATE_FUNCTION &&
    CREATE_BIND_COMPONENT.has(node.escapedText.toString())) {
    return true;
  }
  return false;
}

function transformBuilder(argumentsArr: ts.NodeArray<ts.Expression>): ts.NodeArray<ts.Expression> {
  const newArguments: ts.Expression[] = [];
  argumentsArr.forEach((argument: ts.Expression) => {
    newArguments.push(parseCreateParameterBuilder(argument));
  });
  // @ts-ignore
  return newArguments;
}

function parseCreateParameterBuilder(argument: ts.Expression):ts.Expression {
  if (ts.isObjectLiteralExpression(argument)) {
    return processObjectPropertyBuilder(argument);
  } else {
    return argument;
  }
}

function checkNonspecificParents(node: ts.ExpressionStatement, name: string, savedParent: string, log: LogInfo[]): void {
  if (SPECIFIC_PARENT_COMPONENT.has(name)) {
    const specificParemtsSet: Set<string> = SPECIFIC_PARENT_COMPONENT.get(name);
    if (!specificParemtsSet.has(savedParent) && INNER_COMPONENT_NAMES.has(savedParent)) {
      const specificParentArray: string =
        Array.from(SPECIFIC_PARENT_COMPONENT.get(name)).join(',');
      log.push({
        type: LogType.ERROR,
        message: `The '${name}' component can only be nested in the '${specificParentArray}' parent component.`,
        pos: node.expression.getStart()
      });
    }
  }
}
