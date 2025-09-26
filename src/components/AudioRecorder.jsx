import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

let recorderInstance = null;

const AudioRecorder = ({ onAudioRecorded, onAudioRemoved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState('00:00');
  const [audioFile, setAudioFile] = useState(null);
  
  const audioRecorderPlayer = useRef(null);
  const recordBackListener = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    // Use the singleton instance
    if (!recorderInstance) {
      recorderInstance = new AudioRecorderPlayer();
    }
    audioRecorderPlayer.current = recorderInstance;
    
    // Reset state
    setIsRecording(false);
    setRecordedTime('00:00');
    setAudioFile(null);
    
    return () => {
      if (mounted.current) {
        cleanup().then(() => {
          mounted.current = false;
          if (audioRecorderPlayer.current === recorderInstance) {
            audioRecorderPlayer.current = null;
          }
        });
      }
    };
  }, []);

  const cleanup = async () => {
    try {
      if (audioRecorderPlayer.current) {
        // First remove the listener if it exists
        if (recordBackListener.current) {
          audioRecorderPlayer.current.removeRecordBackListener();
          recordBackListener.current = null;
        }
        
        // Then stop recording if needed
        if (isRecording) {
          try {
            await audioRecorderPlayer.current.stopRecorder();
          } catch (e) {
            // Ignore stop errors
          }
          setIsRecording(false);
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    } finally {
      // Reset state
      if (mounted.current) {
        setRecordedTime('00:00');
      }
    }
  };

  const onStartRecord = async () => {
    try {
      // Clean up any existing recording session
      await cleanup();

      if (!mounted.current) return;

      const audioPath = Platform.select({
        ios: 'issue_report.m4a',
        android: `${Platform.OS === 'android' ? 'sdcard/' : ''}issue_report.mp4`,
      });

      // Re-initialize recorder if needed
      if (!audioRecorderPlayer.current) {
        audioRecorderPlayer.current = new AudioRecorderPlayer();
      }

      await audioRecorderPlayer.current.startRecorder(audioPath);
      
      if (!mounted.current) {
        await cleanup();
        return;
      }

      recordBackListener.current = audioRecorderPlayer.current.addRecordBackListener((e) => {
        if (mounted.current) {
          setRecordedTime(audioRecorderPlayer.current.mmssss(Math.floor(e.currentPosition)));
        }
      });
      
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed to start:', error);
      if (mounted.current) {
        setIsRecording(false);
      }
    }
  };

  const onStopRecord = async () => {
    try {
      if (!audioRecorderPlayer.current || !mounted.current) return;

      const result = await audioRecorderPlayer.current.stopRecorder();
      
      if (!mounted.current) return;

      if (recordBackListener.current) {
        audioRecorderPlayer.current.removeRecordBackListener();
        recordBackListener.current = null;
      }

      setIsRecording(false);
      setAudioFile(result);
      onAudioRecorded(result);
    } catch (error) {
      console.error('Recording failed to stop:', error);
      if (mounted.current) {
        setIsRecording(false);
      }
    }
  };

  const handleRemoveAudio = () => {
    cleanup();
    setAudioFile(null);
    onAudioRemoved();
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.recordButton,
        isRecording && styles.recordingActive
      ]}>
        <TouchableOpacity
          onPress={isRecording ? onStopRecord : onStartRecord}
          style={styles.recordTouchable}
        >
          <View style={styles.recordContent}>
            <Icon
              name={isRecording ? "stop-circle" : "microphone"}
              size={24}
              color={isRecording ? "#FF4444" : "#666666"}
            />
            <Text style={[
              styles.recordButtonText,
              isRecording && styles.recordingActiveText
            ]}>
              {isRecording ? `Recording ${recordedTime}` : 'Record Description'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {audioFile && (
        <View style={styles.audioPreview}>
          <View style={styles.audioPreviewContent}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.audioPreviewText}>Audio description recorded</Text>
            <TouchableOpacity
              onPress={handleRemoveAudio}
              style={styles.removeAudioButton}
            >
              <Icon name="close-circle" size={20} color="#FF5252" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  recordButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  recordingActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4444',
  },
  recordTouchable: {
    width: '100%',
    padding: 12,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666666',
  },
  recordingActiveText: {
    color: '#FF4444',
  },
  audioPreview: {
    backgroundColor: '#E8F5E9',
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  audioPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  audioPreviewText: {
    marginLeft: 10,
    color: '#4CAF50',
    flex: 1,
  },
  removeAudioButton: {
    padding: 4,
  },
});

export default AudioRecorder;