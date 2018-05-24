// @flow
import React from 'react';
import PropTypes from 'prop-types';
import {type ProviderContext, providerContextTypes} from './Provider';

export type ElementsList = Array<{type: string, element: ElementShape}>;
export type ElementsLoadListener = ElementsShape => void;

type Props = {
  children?: any,
};

type State = {
  registeredElements: ElementsList,
};

export type InjectContext = {
  getRegisteredElements: () => ElementsList,
};

export const injectContextTypes = {
  getRegisteredElements: PropTypes.func.isRequired,
};

export type ElementContext = {
  addElementsLoadListener: ElementsLoadListener => void,
  registerElement: (type: string, element: ElementShape) => void,
  unregisterElement: (element: ElementShape) => void,
};

export const elementContextTypes = {
  addElementsLoadListener: PropTypes.func.isRequired,
  registerElement: PropTypes.func.isRequired,
  unregisterElement: PropTypes.func.isRequired,
};

type ChildContext = InjectContext & ElementContext;

export default class Elements extends React.Component<Props, State> {
  static childContextTypes = {
    ...injectContextTypes,
    ...elementContextTypes,
  };
  static contextTypes = providerContextTypes;
  static defaultProps = {
    children: null,
  };
  constructor(props: Props, context: ProviderContext) {
    super(props, context);

    this.state = {
      registeredElements: [],
    };
  }

  getChildContext(): ChildContext {
    return {
      addElementsLoadListener: (fn: ElementsLoadListener) => {
        // Return the existing elements instance if we already have one.
        // Stripe.js browser-only check
        if (typeof window === 'object') {
        if (this._elements) {
          fn(this._elements);
          return;
        }
        const {children, ...options} = this.props;
        if (this.context.tag === 'sync') {
          this._elements = this.context.stripe.elements(options);
          fn(this._elements);
        } else {
          this.context.addStripeLoadListener((stripe: StripeShape) => {
            if (this._elements) {
              fn(this._elements);
            } else {
              this._elements = stripe.elements(options);
              fn(this._elements);
            }
          });
        }
        }
      },
      registerElement: this.handleRegisterElement,
      unregisterElement: this.handleUnregisterElement,
      getRegisteredElements: () => this.state.registeredElements,
    };
  }
  props: Props;
  context: ProviderContext;
  _elements: ElementsShape;

  handleRegisterElement = (type: string, element: Object) => {
    this.setState(prevState => ({
      registeredElements: [...prevState.registeredElements, {type, element}],
    }));
  };

  handleUnregisterElement = (el: Object) => {
    this.setState(prevState => ({
      registeredElements: prevState.registeredElements.filter(
        ({element}) => element !== el
      ),
    }));
  };

  render() {
    return React.Children.only(this.props.children);
  }
}
