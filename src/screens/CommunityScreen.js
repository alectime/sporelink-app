import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity style={styles.channelButton}>
            <Text style={styles.channelButtonText}>Channels</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.feedItem}>
          <View style={styles.feedHeader}>
            <Text style={styles.username}>JohnDoe</Text>
            <Text style={styles.timestamp}>2h ago</Text>
          </View>
          <View style={styles.feedContent}>
            <Text style={styles.feedText}>Just harvested my first flush of Golden Teachers! 🍄</Text>
          </View>
          <View style={styles.feedActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  channelButton: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  channelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedItem: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    padding: 16,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#666',
  },
  feedContent: {
    marginBottom: 12,
  },
  feedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  feedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  actionButton: {
    marginRight: 24,
  },
  actionText: {
    color: '#666',
    fontWeight: '500',
  },
}); 