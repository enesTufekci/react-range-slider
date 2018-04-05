import * as React from 'react';
import styled from 'styled-components';

const HandleButton = styled.button`
  border: none;
  outline: none;
  box-shadow: 0px 0px 1px 1px rgba(0, 0, 0, 0.5);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: orange;
  cursor: grab;
  position: absolute;
`;

export interface HandleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  left: string;
  tabIndex: number;
}

const Handle: React.SFC<HandleButtonProps> = props => (
  <HandleButton style={{ left: `${props.left}`, zIndex: props.tabIndex + 1 }} {...props} />
);

export default Handle;
