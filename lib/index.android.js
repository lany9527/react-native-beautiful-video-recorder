import React, { Component } from 'react';
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  InteractionManager,
} from 'react-native';
import PropTypes from 'prop-types'
import moment from 'moment';
import {RNCamera} from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RecordingButton from './RecordingButton';
import styles, {width, height} from './style';

export default class VideoRecorder extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
  }

  static defaultProps = {
    isOpen: false,
  }

  constructor(...props) {
    super(...props);
    this.state = {
      isOpen: this.props.isOpen,
      loading: true,
      time: 0,
      recorded: false,
      recordedData: null,
      type: RNCamera.Constants.Type.back,
    };
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({ loading: false });
    });
  }

  onSave = () => {
    if (this.callback) this.callback(this.state.recordedData);
    this.close();
  }

  onFlip(){
    let newType;
    const { back, front } = RNCamera.Constants.Type;

    if (this.state.type === back) {
      newType = front;
    } else if (this.state.type === front) {
      newType = back;
    }

    this.setState({
      type: newType
    });

  }

  open = (callback) => {
    this.callback = callback;
    this.setState({
      isOpen: true,
      isRecording: false,
      time: 0,
      recorded: false,
      recordedData: null,
    });
  }

  close = () => {
    this.setState({ isOpen: false });
  }

  startCapture = () => {
    InteractionManager.runAfterInteractions(() => {
      this.camera.recordAsync({
        quality: RNCamera.Constants.VideoQuality["720p"]
      }).then((data) => {
        console.log('video capture', data);
        this.setState({
          recorded: true,
          recordedData: data,
        });
      }).catch(err => console.error(err));
      setTimeout(() => {
        this.startTimer();
        this.setState({
          isRecording: true,
          recorded: false,
          recordedData: null,
          time: 0,
        });
      });
    });
  }

  stopCapture = () => {
    InteractionManager.runAfterInteractions(() => {
      this.stopTimer();
      this.camera.stopRecording();
      this.setState({
        isRecording: false,
      });
    });
  }

  startTimer = () => {
    this.timer = setInterval(() => {
      this.setState({ time: this.state.time + 1 });
    }, 1000);
  }

  stopTimer = () => {
    if (this.timer) clearInterval(this.timer);
  }

  convertTimeString = (time) => {
    return moment().startOf('day').seconds(time).format('mm:ss');
  }

  renderTimer() {
    const { isRecording, time, recorded } = this.state;
    return (
      <View>
        {
          (recorded || isRecording) &&
          <Text style={styles.durationText}>
            <Text style={styles.dotText}>●</Text> {this.convertTimeString(time)}
          </Text>
        }
      </View>
    );
  }

  renderContent() {
    const { isRecording, recorded } = this.state;
    return (
      <View style={styles.controlLayer}>
        {this.renderTimer()}
        <View style={[styles.controls]}>
          <TouchableOpacity onPress={this.onFlip.bind(this)} style={styles.btnFlip}>
            <View style={styles.btnUseContainer}>
              <Icon style={styles.btnUseText} name="cached" size={24} color="white" />
            </View>
          </TouchableOpacity>
          <RecordingButton style={styles.recodingButton} isRecording={isRecording} onStartPress={this.startCapture}
            onStopPress={this.stopCapture} />
          {
            recorded &&
              <TouchableOpacity onPress={this.onSave} style={styles.btnUse}>
                <View style={styles.btnUseContainer}>
                  <Icon style={styles.btnUseText} name="done" size={24} color="white" />
                </View>
              </TouchableOpacity>
          }
        </View>
      </View>
    );
  }

  renderCamera() {
    let cameraHeight = height, cameraWidth = width;
    if(height > width){
      cameraHeight = 4/3*width;
    }else{
      cameraWidth = 4/3*height;
    }
    return (
      <RNCamera
        ref={(cam) => { this.camera = cam; }}
        style={[styles.preview, {width: cameraWidth, height: cameraHeight}]}
        captureAudio
        ratio="4:3"
        type={this.state.type}>
        {this.renderContent()}
      </RNCamera>
    );
  }

  render() {
    const { loading, isOpen } = this.state;
    if (loading) return <View />;
    return (
      <Modal visible={isOpen} transparent animationType="fade"
        onRequestClose={this.close}>
        <View style={styles.modal}>
          <TouchableWithoutFeedback onPress={this.close}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.content}>
              {this.renderCamera()}
            </View>
            <TouchableOpacity onPress={this.close} style={styles.buttonClose}>
              <Icon name="close" size={32} color={'white'} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
}
