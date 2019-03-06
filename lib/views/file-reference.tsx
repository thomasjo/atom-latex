import path from "path";
import React from "react";

interface Props {
  type?: string;
  file?: string;
  range?: number[][];
}

interface State {
  fileName?: string;
  lineReference?: string;
}

export default class FileReference extends React.Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    type: "error",
  };

  constructor(props: Props) {
    super(props);

    const filePath = this.props.file;
    if (filePath) {
      const fileName = path.basename(filePath);
      this.setState({ fileName });
    }

    const range = this.props.range;
    if (range) {
      const endLineReference = (range[0][0] !== range[1][0]) ? `\u2013${range[1][0] + 1}` : "";
      const lineReference = range ? ` (${range[0][0] + 1}${endLineReference})` : "";
      this.setState({ lineReference });
    }
  }

  public handleClick = async () => {
    const filePath = this.props.file!;
    const initialLine = this.props.range ? this.props.range[0][0] : 0;

    await atom.workspace.open(filePath, { initialLine });
  }

  public render() {
    if (this.state.fileName) {
      return (
        <a className="latex-file-reference" href="#" onClick={this.handleClick}>
          {this.state.fileName}
          {this.state.lineReference}
        </a>
      );
    }

    return <span />;
  }
}
