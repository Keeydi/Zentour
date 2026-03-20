import { colors } from '../theme/colors';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { useDriver } from '../contexts/DriverContext';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

const { height } = Dimensions.get('window');

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { signup } = useAuth();
  const { signup: driverSignup } = useDriver();
  const [isDriver, setIsDriver] = useState(false);
  
  // Passenger fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Driver fields
  const [address, setAddress] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [jeepneyId, setJeepneyId] = useState('');
  const [vehicleType, setVehicleType] = useState('Jeepney');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasUpperCase: false,
    hasMinLength: false,
    hasNumbers: false,
    hasSpecialChar: false,
  });

  const checkPasswordRequirements = (pwd: string) => {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasMinLength = pwd.length >= 8;
    const hasNumbers = (pwd.match(/\d/g) || []).length >= 2;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    setPasswordRequirements({
      hasUpperCase,
      hasMinLength,
      hasNumbers,
      hasSpecialChar,
    });
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    Toast.show({
      type: type,
      text1: type === 'error' ? 'Error' : 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    checkPasswordRequirements(text);
  };

  const handleSignup = async () => {
    if (isDriver) {
      // Driver signup validation
      if (!name || !email || !password || !confirmPassword || !phone || !address || !plateNumber || !licenseNumber) {
        showToast('error', 'Please fill in all required fields');
        return;
      }

      // Check all password requirements
      if (!passwordRequirements.hasUpperCase || 
          !passwordRequirements.hasMinLength || 
          !passwordRequirements.hasNumbers || 
          !passwordRequirements.hasSpecialChar) {
        showToast('error', 'Password does not meet all requirements');
        return;
      }

      if (password !== confirmPassword) {
        showToast('error', 'Passwords do not match');
        return;
      }

      // Validate plate number format (basic)
      if (plateNumber.length < 3) {
        showToast('error', 'Please enter a valid plate number');
        return;
      }

      // Validate license number format (basic)
      if (licenseNumber.length < 5) {
        showToast('error', 'Please enter a valid license number');
        return;
      }

      setIsLoading(true);

      const result = await driverSignup(
        email,
        password,
        name,
        phone,
        jeepneyId || undefined,
        address,
        plateNumber,
        licenseNumber,
        vehicleType,
        vehicleModel,
        vehicleColor
      );
      setIsLoading(false);

      if (result.success) {
        showToast('success', 'Driver account created successfully!');
        navigation.replace('DriverDashboard');
      } else {
        const errorMessage = result.error || 'Signup failed. Please try again.';
        showToast('error', errorMessage);
      }
    } else {
      // Passenger signup validation
      if (!name || !email || !password || !confirmPassword) {
        showToast('error', 'Please fill in all required fields');
        return;
      }

      // Check all password requirements
      if (!passwordRequirements.hasUpperCase || 
          !passwordRequirements.hasMinLength || 
          !passwordRequirements.hasNumbers || 
          !passwordRequirements.hasSpecialChar) {
        showToast('error', 'Password does not meet all requirements');
        return;
      }

      if (password !== confirmPassword) {
        showToast('error', 'Passwords do not match');
        return;
      }

      if (!acceptedTerms) {
        showToast('error', 'Please accept the Terms and Conditions to continue');
        return;
      }

      setIsLoading(true);

      const result = await signup(email, password, name, phone || undefined);
      setIsLoading(false);

      if (result.success) {
        showToast('success', 'Account created successfully!');
        navigation.replace('Home');
      } else {
        const errorMessage = result.error || 'Signup failed. Please try again.';
        showToast('error', errorMessage);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            {isDriver ? 'Apply as a Driver' : 'Start your journey with ZenRoute'}
          </Text>
          
          {/* Account Type Toggle */}
          <View style={styles.accountTypeContainer}>
            <TouchableOpacity
              style={[styles.accountTypeButton, !isDriver && styles.accountTypeButtonActive]}
              onPress={() => setIsDriver(false)}
            >
              <Text style={[styles.accountTypeText, !isDriver && styles.accountTypeTextActive]}>
                Passenger
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accountTypeButton, isDriver && styles.accountTypeButtonActive]}
              onPress={() => setIsDriver(true)}
            >
              <Text style={[styles.accountTypeText, isDriver && styles.accountTypeTextActive]}>
                Driver
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
              }}
              autoCapitalize="words"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Phone Number {isDriver ? '*' : '(Optional)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
              }}
              keyboardType="phone-pad"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
            />
          </View>

          {/* Driver-specific fields */}
          {isDriver && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your complete address"
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                  }}
                  autoCapitalize="words"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Plate Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter vehicle plate number"
                  value={plateNumber}
                  onChangeText={(text) => {
                    setPlateNumber(text.toUpperCase());
                  }}
                  autoCapitalize="characters"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your driver's license number"
                  value={licenseNumber}
                  onChangeText={(text) => {
                    setLicenseNumber(text.toUpperCase());
                  }}
                  autoCapitalize="characters"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Type</Text>
                <View style={styles.vehicleTypeContainer}>
                  <TouchableOpacity
                    style={[styles.vehicleTypeButton, vehicleType === 'Jeepney' && styles.vehicleTypeButtonActive]}
                    onPress={() => setVehicleType('Jeepney')}
                  >
                    <Text style={[styles.vehicleTypeText, vehicleType === 'Jeepney' && styles.vehicleTypeTextActive]}>
                      Jeepney
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.vehicleTypeButton, vehicleType === 'Tricycle' && styles.vehicleTypeButtonActive]}
                    onPress={() => setVehicleType('Tricycle')}
                  >
                    <Text style={[styles.vehicleTypeText, vehicleType === 'Tricycle' && styles.vehicleTypeTextActive]}>
                      Tricycle
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jeepney/Tricycle ID (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your jeepney/tricycle ID"
                  value={jeepneyId}
                  onChangeText={(text) => {
                    setJeepneyId(text);
                  }}
                  autoCapitalize="characters"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Model (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Toyota Tamaraw, Honda TMX"
                  value={vehicleModel}
                  onChangeText={(text) => {
                    setVehicleModel(text);
                  }}
                  autoCapitalize="words"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Color (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Red, Blue, Yellow"
                  value={vehicleColor}
                  onChangeText={(text) => {
                    setVehicleColor(text);
                  }}
                  autoCapitalize="words"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showHideText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.passwordRequirementsContainer}>
                <Text style={styles.passwordRequirementsTitle}>Password must contain:</Text>
                <View style={styles.requirementItem}>
                  <Text style={[
                    styles.requirementText,
                    passwordRequirements.hasUpperCase && styles.requirementMet
                  ]}>
                    {passwordRequirements.hasUpperCase ? '✓' : '○'} At least 1 uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={[
                    styles.requirementText,
                    passwordRequirements.hasMinLength && styles.requirementMet
                  ]}>
                    {passwordRequirements.hasMinLength ? '✓' : '○'} At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={[
                    styles.requirementText,
                    passwordRequirements.hasNumbers && styles.requirementMet
                  ]}>
                    {passwordRequirements.hasNumbers ? '✓' : '○'} At least 2 numbers
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={[
                    styles.requirementText,
                    passwordRequirements.hasSpecialChar && styles.requirementMet
                  ]}>
                    {passwordRequirements.hasSpecialChar ? '✓' : '○'} At least 1 special character
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showHideText}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => {
                  // TODO: Navigate to Terms & Conditions screen
                  showToast('info', 'Terms & Conditions screen coming soon');
                }}>
                  Terms and Conditions
                </Text>
                {' '}and{' '}
                <Text style={styles.termsLink} onPress={() => {
                  // TODO: Navigate to Privacy Policy screen
                  showToast('info', 'Privacy Policy screen coming soon');
                }}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>
                {isDriver ? 'Apply as Driver' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showHideText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
  },
  signupButton: {
    backgroundColor: '#1E88E5', // Blue matching landing page
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  termsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxChecked: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  termsLink: {
    color: '#1E88E5',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  footerLink: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  passwordRequirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordRequirementsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    opacity: 0.9,
  },
  requirementItem: {
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  requirementMet: {
    color: '#fff',
    fontWeight: '500',
    opacity: 1,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#1E88E5',
  },
  accountTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  vehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  vehicleTypeTextActive: {
    color: '#fff',
  },
});

export default SignupScreen;

