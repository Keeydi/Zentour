import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, FlatList, Platform, Animated, Keyboard } from 'react-native';

interface DestinationSearchBarProps {
  onDestinationSelect?: (destination: { latitude: number; longitude: number; address?: string }) => void;
  onFocusChange?: (focused: boolean) => void;
}

export interface DestinationSearchBarRef {
  dismiss: () => void;
}

// Mock search results - in real app, this would come from a geocoding API
const mockSearchResults = [
  { id: '1', address: 'Manila City Hall', latitude: 14.6042, longitude: 120.9822 },
  { id: '2', address: 'Rizal Park', latitude: 14.5832, longitude: 120.9797 },
  { id: '3', address: 'Intramuros', latitude: 14.5906, longitude: 120.9760 },
  { id: '4', address: 'SM Mall of Asia', latitude: 14.5350, longitude: 120.9820 },
];

const DestinationSearchBar = forwardRef<DestinationSearchBarRef, DestinationSearchBarProps>(
  ({ onDestinationSelect, onFocusChange }, ref) => {
  const [searchText, setSearchText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState(mockSearchResults);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    dismiss: () => {
      Keyboard.dismiss();
      inputRef.current?.blur();
      setShowResults(false);
      if (onFocusChange) {
        onFocusChange(false);
      }
    },
  }));

  useEffect(() => {
    if (showResults) {
      // Use shorter, smoother animations
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showResults]);

  const handleTextChange = (text: string) => {
    setSearchText(text);
    // Debounce filtering for better performance
    if (text.length > 0) {
      const filtered = mockSearchResults.filter(result =>
        result.address.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredResults(filtered.length > 0 ? filtered : mockSearchResults);
      if (!showResults) {
        setShowResults(true);
      }
    } else {
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: typeof mockSearchResults[0]) => {
    setSearchText(result.address);
    setShowResults(false);
    if (onFocusChange) {
      onFocusChange(false);
    }
    if (onDestinationSelect) {
      onDestinationSelect({
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.address,
      });
    }
  };

  const handleSearch = () => {
    // Mock destination - in real app, this would use geocoding API
    if (onDestinationSelect && searchText) {
      onDestinationSelect({
        latitude: 14.6042,
        longitude: 120.9822,
        address: searchText || 'Selected destination',
      });
      setShowResults(false);
      if (onFocusChange) {
        onFocusChange(false);
      }
    }
  };

  const handleFocus = () => {
    if (onFocusChange) {
      onFocusChange(true);
    }
    if (searchText.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow selection
    setTimeout(() => {
      setShowResults(false);
      if (onFocusChange) {
        onFocusChange(false);
      }
    }, 150);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Enter destination..."
          value={searchText}
          onChangeText={handleTextChange}
          placeholderTextColor="#999"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {showResults && filteredResults.length > 0 && (
        <Animated.View
          style={[
            styles.resultsContainer,
            {
              opacity: opacityAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectResult(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.resultText}>{item.address}</Text>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
    ...Platform.select({
      ios: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#333',
  },
  button: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultsContainer: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#E3F2FD',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  resultsList: {
    flexGrow: 0,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  resultText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
});

DestinationSearchBar.displayName = 'DestinationSearchBar';

export default DestinationSearchBar;

