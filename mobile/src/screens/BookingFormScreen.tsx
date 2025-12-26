import React, { useState, useEffect } from 'react';
import SuccessAnimation from '../components/SuccessAnimation';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { RootStackParamList } from '../navigation/AppNavigator';
import FormInput from '../components/FormInput';
import FormPicker from '../components/FormPicker';
import { submitBooking, BookingFormData, uploadInvoiceImage } from '../services/api';
import { API_BASE_URL } from '../config/api';
import socketService from '../services/socketService';

// using centralized API_BASE_URL from `src/config/api.ts`

type BookingFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BookingForm'
>;

type Props = {
  navigation: BookingFormScreenNavigationProp;
};

interface Brand {
  _id: string;
  name: string;
  logo?: string;
  isActive: boolean;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .optional(),
  phone: Yup.string()
    .matches(/^[0-9]{10,}$/, 'Phone number must be at least 10 digits')
    .required('Phone number is required'),
  invoiceImage: Yup.string().optional(),
  alternatePhone: Yup.string()
    .matches(/^[0-9]{10,}$/, 'Alternate phone must be at least 10 digits')
    .optional(),
  address: Yup.string()
    .min(10, 'Address must be at least 10 characters')
    .required('Address is required'),
  alternateAddress: Yup.string().optional(),
  landmark: Yup.string().required('Landmark is required'),
  serialNumber: Yup.string().optional(),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  pinCode: Yup.string()
    .matches(/^[0-9]{4,7}$/, 'Pin code must be 4 to 7 digits')
    .required('Pin code is required'),
  serviceType: Yup.string()
    .oneOf(['New Installation', 'Service Complaint'])
    .required('Service type is required'),
  problemDescription: Yup.string().when('serviceType', {
    is: 'Service Complaint',
    then: (schema) => schema.required('Problem description is required for service complaints'),
    otherwise: (schema) => schema.optional(),
  }),
  dateOfPurchase: Yup.string().optional(),
  category: Yup.string().required('Category is required'),
  brand: Yup.string().required('Brand is required'),
  model: Yup.string()
    .min(2, 'Model must be at least 2 characters')
    .required('Model is required'),
});

export default function BookingFormScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 100 : 0;

  const initialValues = {
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    alternateAddress: '',
    landmark: '',
    serialNumber: '',
    city: '',
    state: '',
    pinCode: '',
    serviceType: '',
    problemDescription: '',
    dateOfPurchase: '',
    category: '',
    brand: '',
    model: '',
    invoiceImage: '',
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const url = `${API_BASE_URL}/categories`;
      console.log('🔍 Fetching categories from:', url);
      const response = await axios.get(url);
      console.log('📦 Categories response received:', response.data);

      if (response.data.success && response.data.data) {
        const fetchedCategories: Category[] = response.data.data;
        setCategories(fetchedCategories);

        // Extract category names for picker (backend already filters by isActive)
        const names = fetchedCategories.map((category) => category.name);
        setCategoryOptions(names);

        console.log('✅ Categories loaded:', names);
      }
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      console.error('❌ Error details:', error.message, error.code);
      // Fallback to empty array if API fails
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch brands from API (all brands initially)
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const url = `${API_BASE_URL}/brands`;
      console.log('🔍 Fetching brands from:', url);
      const response = await axios.get(url);
      console.log('📦 Response received:', response.data);

      if (response.data.success && response.data.data) {
        const fetchedBrands: Brand[] = response.data.data;
        setBrands(fetchedBrands);

        // Extract brand names for picker (backend already filters by isActive)
        const names = fetchedBrands.map((brand) => brand.name);
        setBrandOptions(names);

        console.log('✅ Brands loaded:', names);
      }
    } catch (error: any) {
      console.error('❌ Error fetching brands:', error);
      console.error('❌ Error details:', error.message, error.code);
      // Fallback to empty array if API fails
      setBrandOptions([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Fetch brands by specific category
  const fetchBrandsByCategory = async (categoryId: string) => {
    try {
      setLoadingBrands(true);
      const url = `${API_BASE_URL}/brands/category/${categoryId}`;
      console.log('🔍 Fetching brands for category:', categoryId);
      const response = await axios.get(url);
      console.log('📦 Category brands response:', response.data);

      if (response.data.success && response.data.data) {
        const fetchedBrands: Brand[] = response.data.data;
        setBrands(fetchedBrands);

        // Extract brand names for picker
        const names = fetchedBrands.map((brand) => brand.name);
        setBrandOptions(names);

        console.log('✅ Brands for category loaded:', names);
      }
    } catch (error: any) {
      console.error('❌ Error fetching brands for category:', error);
      setBrandOptions([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Setup Socket.IO listeners for real-time updates
  useEffect(() => {
    // Initial fetch for both categories and brands
    fetchCategories();
    fetchBrands();

    // Setup Socket.IO listeners for brands
    const handleBrandCreated = (data: any) => {
      console.log('⚡ New brand created:', data);
      fetchBrands(); // Refresh brands list
    };

    const handleBrandUpdated = (data: any) => {
      console.log('⚡ Brand updated:', data);
      fetchBrands(); // Refresh brands list
    };

    const handleBrandDeleted = (data: any) => {
      console.log('⚡ Brand deleted:', data);
      fetchBrands(); // Refresh brands list
    };

    socketService.on('brandCreated', handleBrandCreated);
    socketService.on('brandUpdated', handleBrandUpdated);
    socketService.on('brandDeleted', handleBrandDeleted);

    // Cleanup listeners on unmount
    return () => {
      socketService.off('brandCreated', handleBrandCreated);
      socketService.off('brandUpdated', handleBrandUpdated);
      socketService.off('brandDeleted', handleBrandDeleted);
    };
  }, []);

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: any
  ) => {
    try {
      // Find category ID from category name
      const selectedCategory = categories.find(c => c.name === values.category);
      const categoryId = selectedCategory?._id;

      if (!categoryId && values.category) {
        throw new Error('Invalid category selected');
      }

      // Prepare data for API
      const bookingData: BookingFormData = {
        name: values.name,
        phone: values.phone,
        alternatePhone: values.alternatePhone || undefined,
        address: values.address,
        alternateAddress: values.alternateAddress || undefined,
        landmark: values.landmark || undefined,
        serialNumber: values.serialNumber || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        pinCode: values.pinCode || undefined,
        serviceType: values.serviceType,
        email: values.email || undefined,
        problemDescription: values.serviceType === 'Service Complaint' ? values.problemDescription : undefined,
        dateOfPurchase: values.dateOfPurchase || undefined,
        category: categoryId,
        categoryName: values.category,
        brand: values.brand,
        model: values.model,
        invoiceImage: values.invoiceImage || undefined,
      };

      console.log('Submitting booking:', bookingData);

      // Submit to backend
      const response = await submitBooking(bookingData);

      // Show success animation
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          isSubmitting,
        }) => (
          <KeyboardAvoidingView
            style={styles.keyboardAvoider}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={keyboardVerticalOffset}
          >
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
              <Text style={styles.title}>Book a Demo</Text>
              <Text style={styles.subtitle}>Fill in your details below</Text>

              <FormInput
                label="Customer Name *"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={() => handleBlur('name')}
                placeholder="Enter your name"
                error={errors.name}
                touched={touched.name}
              />

            <FormInput
              label="Contact Number *"
              value={values.phone}
              onChangeText={handleChange('phone')}
              onBlur={() => handleBlur('phone')}
              placeholder="Enter 10-digit phone number"
              keyboardType="phone-pad"
              error={errors.phone}
              touched={touched.phone}
            />

            <FormInput
              label="Email (Optional)"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={() => handleBlur('email')}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              touched={touched.email}
            />

            <FormInput
              label="Alternate Contact Number (Optional)"
              value={values.alternatePhone}
              onChangeText={handleChange('alternatePhone')}
              onBlur={() => handleBlur('alternatePhone')}
              placeholder="Enter alternate 10-digit phone number"
              keyboardType="phone-pad"
              error={errors.alternatePhone}
              touched={touched.alternatePhone}
            />

            <FormInput
              label="Address *"
              value={values.address}
              onChangeText={handleChange('address')}
              onBlur={() => handleBlur('address')}
              placeholder="Enter your complete address"
              multiline
              numberOfLines={3}
              error={errors.address}
              touched={touched.address}
            />

            <FormInput
              label="Alternate Address (Optional)"
              value={values.alternateAddress}
              onChangeText={handleChange('alternateAddress')}
              onBlur={() => handleBlur('alternateAddress')}
              placeholder="Enter alternate/secondary address"
              multiline
              numberOfLines={2}
            />

            <FormInput
              label="Landmark *"
              value={values.landmark}
              onChangeText={handleChange('landmark')}
              onBlur={() => handleBlur('landmark')}
              placeholder="Enter nearby landmark or location reference"
              error={errors.landmark}
              touched={touched.landmark}
            />

            <FormInput
              label="Serial Number (Optional)"
              value={values.serialNumber}
              onChangeText={handleChange('serialNumber')}
              onBlur={() => handleBlur('serialNumber')}
              placeholder="Enter product serial number"
              error={errors.serialNumber}
              touched={touched.serialNumber}
            />

            <FormInput
              label="City *"
              value={values.city}
              onChangeText={handleChange('city')}
              onBlur={() => handleBlur('city')}
              placeholder="Enter city"
              error={errors.city}
              touched={touched.city}
            />

            <FormInput
              label="State *"
              value={values.state}
              onChangeText={handleChange('state')}
              onBlur={() => handleBlur('state')}
              placeholder="Enter state"
              error={errors.state}
              touched={touched.state}
            />

            <FormInput
              label="Pin Code *"
              value={values.pinCode}
              onChangeText={handleChange('pinCode')}
              onBlur={() => handleBlur('pinCode')}
              placeholder="Enter pin / postal code"
              keyboardType="numeric"
              error={errors.pinCode}
              touched={touched.pinCode}
            />

            <FormPicker
              label="Service Type *"
              value={values.serviceType}
              onValueChange={(value) => {
                setFieldValue('serviceType', value);
                // Clear problem description if switching to New Installation
                if (value === 'New Installation') {
                  setFieldValue('problemDescription', '');
                }
              }}
              options={['New Installation', 'Service Complaint']}
              placeholder="Select service type"
              error={errors.serviceType}
              touched={touched.serviceType}
            />

            {values.serviceType === 'Service Complaint' && (
              <FormInput
                label="Problem Description *"
                value={values.problemDescription}
                onChangeText={handleChange('problemDescription')}
                onBlur={() => handleBlur('problemDescription')}
                placeholder="Describe the problem you're experiencing"
                multiline
                numberOfLines={4}
                error={errors.problemDescription}
                touched={touched.problemDescription}
              />
            )}

            <FormInput
              label="Date of Purchase (Optional)"
              value={values.dateOfPurchase}
              onChangeText={handleChange('dateOfPurchase')}
              onBlur={() => handleBlur('dateOfPurchase')}
              placeholder="DD/MM/YYYY"
              error={errors.dateOfPurchase}
              touched={touched.dateOfPurchase}
            />

            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <FormPicker
                label="Category *"
                value={values.category}
                onValueChange={(value) => {
                  setFieldValue('category', value);
                  // Fetch brands for selected category
                  const selectedCategory = categories.find(c => c.name === value);
                  if (selectedCategory && selectedCategory._id) {
                    fetchBrandsByCategory(selectedCategory._id);
                  } else {
                    // If no category selected, clear brands
                    setBrandOptions([]);
                  }
                }}
                options={categoryOptions}
                placeholder={categoryOptions.length > 0 ? "Select a category" : "No categories available"}
                error={errors.category}
                touched={touched.category}
              />
            )}

            {loadingBrands ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading brands...</Text>
              </View>
            ) : (
              <FormPicker
                label="Brand *"
                value={values.brand}
                onValueChange={(value) => {
                  setFieldValue('brand', value);
                  // Manually trigger touched state
                  setFieldValue('brand', value, true);
                }}
                options={brandOptions}
                placeholder={brandOptions.length > 0 ? "Select a brand" : "No brands available"}
                error={errors.brand}
                touched={touched.brand}
              />
            )}

            <FormInput
              label="Model *"
              value={values.model}
              onChangeText={handleChange('model')}
              onBlur={() => handleBlur('model')}
              placeholder="Enter product model"
              error={errors.model}
              touched={touched.model}
            />

            <TouchableOpacity
              style={[styles.uploadButton, uploadingInvoice && styles.disabledButton]}
              onPress={async () => {
                setUploadingInvoice(true);
                try {
                  let ImagePicker: any;
                  let FileSystem: any;
                  try {
                    ImagePicker = await import('expo-image-picker');
                    FileSystem = await import('expo-file-system');
                  } catch (importErr) {
                    console.error('Invoice upload: native module missing', importErr);
                    Alert.alert(
                      'Update required',
                      'Invoice upload module is not available in this build. Please install the latest update to enable uploads.'
                    );
                    return;
                  }

                  if (!ImagePicker?.launchImageLibraryAsync || !ImagePicker?.MediaTypeOptions) {
                    Alert.alert(
                      'Update required',
                      'Invoice upload module is not available in this build. Please install the latest update to enable uploads.'
                    );
                    return;
                  }

                  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
                  if (permission && permission.status !== 'granted') {
                    Alert.alert('Permission needed', 'Please allow media access to upload invoice images.');
                    return;
                  }

                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: false,
                    quality: 0.7,
                    base64: false,
                  });

                  if (result.canceled) return;

                  const asset = result.assets?.[0];
                  if (!asset?.uri) return;

                  let sizeBytes = asset.fileSize;
                  if (sizeBytes == null) {
                    const info = await FileSystem.getInfoAsync(asset.uri);
                    sizeBytes = info.size;
                  }

                  if (sizeBytes && sizeBytes > 5 * 1024 * 1024) {
                    Alert.alert('File too large', 'Invoice image must be 5MB or smaller.');
                    return;
                  }

                  const uploadedUrl = await uploadInvoiceImage(asset.uri);
                  setFieldValue('invoiceImage', uploadedUrl);
                  Alert.alert('Uploaded', 'Invoice image uploaded successfully.');
                } catch (err: any) {
                  console.error('Invoice upload error:', err);
                  Alert.alert('Upload failed', err?.message || 'Could not upload invoice image.');
                } finally {
                  setUploadingInvoice(false);
                }
              }}
              disabled={uploadingInvoice}
            >
              {uploadingInvoice ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>
                  {values.invoiceImage ? 'Replace Invoice Image' : 'Upload Invoice (max 5MB)'}
                </Text>
              )}
            </TouchableOpacity>
            {values.invoiceImage ? (
              <>
                <Text style={styles.uploadHint}>Invoice uploaded. Tap to replace if needed.</Text>
                <Image
                  source={{ uri: values.invoiceImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </>
            ) : (
              <Text style={styles.uploadHint}>Optional: attach invoice image for faster processing.</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={() => handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Booking</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )}
  </Formik>
  {showSuccess && (
    <SuccessAnimation
      message="Booking submitted successfully!"
      onComplete={() => {
        setShowSuccess(false);
        navigation.goBack();
      }}
    />
  )}
</>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#2980b9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadHint: {
    marginTop: 6,
    color: '#7f8c8d',
    fontSize: 13,
  },
  previewImage: {
    marginTop: 10,
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
});

