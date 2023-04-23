import { PureComponent } from "react";

export default class FromStream extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { value: false };
  }

  componentDidMount() {
    this.initStream();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.stream !== this.props.stream) {
      this.initStream();
    }
  }

  componentWillUnmount() {
    if (this.unSubscribe) {
      this.unSubscribe();
    }
  }

  initStream() {
    if (this.unSubscribe) {
      this.unSubscribe();
      this.unSubscribe = null;
    }

    if (this.props.stream) {
      const onValue = (value) => {
        this.setState(() => ({ value: map(value) }));
      };

      this.props.stream.onValue(onValue);
      this.unSubscribe = () => stream.offValue(onValue);
    }
  }

  render() {
    try {
      return this.props?.children(this.state && this.state.value);
    } catch (err) {
      console.log("ERROR MESSAGE", err);
    }
  }
}
