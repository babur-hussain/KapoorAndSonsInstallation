import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../navigation/AppNavigator';
import FormInput from '../components/FormInput';
import FormPicker from '../components/FormPicker';
import { submitBooking, BookingFormData } from '../services/api';

type BookingFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BookingForm'
>;

type Props = {
  navigation: BookingFormScreenNavigationProp;
};

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10,}$/, 'Phone number must be at least 10 digits')
    .required('Phone number is required'),
  address: Yup.string()
    .min(10, 'Address must be at least 10 characters')
    .required('Address is required'),
  brand: Yup.string().required('Brand is required'),
  model: Yup.string()
    .min(2, 'Model must be at least 2 characters')
    .required('Model is required'),
  invoiceNo: Yup.string(),
  preferredAt: Yup.date().nullable(),
});

const BRAND_OPTIONS = ['Samsung', 'LG', 'Whirlpool', 'Oppo'];

export default function BookingFormScreen({ navigation }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const initialValues = {
    name: '',
    phone: '',
    address: '',
    brand: '',
    model: '',
    invoiceNo: '',
    preferredAt: null as Date | null,
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: any
  ) => {
    try {
      // Prepare data for API
      const bookingData: BookingFormData = {
        name: values.name,
        phone: values.phone,
        address: values.address,
        brand: values.brand,
        model: values.model,
        invoiceNo: values.invoiceNo || undefined,
        preferredAt: values.preferredAt?.toISOString(),
      };

      console.log('Submitting booking:', bookingData);

      // Submit to backend
      const response = await submitBooking(bookingData);

      // Show success alert
      Alert.alert(
        'Success',
        'Booking submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
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
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Book a Demo</Text>
            <Text style={styles.subtitle}>Fill in your details below</Text>

            <FormInput
              label="Customer Name *"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              placeholder="Enter your full name"
              error={errors.name}
              touched={touched.name}
            />

            <FormInput
              label="Contact Number *"
              value={values.phone}
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              placeholder="Enter 10-digit phone number"
              keyboardType="phone-pad"
              error={errors.phone}
              touched={touched.phone}
            />

            <FormInput
              label="Address *"
              value={values.address}
              onChangeText={handleChange('address')}
              onBlur={handleBlur('address')}
              placeholder="Enter your complete address"
              multiline
              numberOfLines={3}
              error={errors.address}
              touched={touched.address}
            />

            <FormPicker
              label="Brand *"
              value={values.brand}
              onValueChange={(value) => setFieldValue('brand', value)}
              onBlur={handleBlur('brand')}
              options={BRAND_OPTIONS}
              placeholder="Select a brand"
              error={errors.brand}
              touched={touched.brand}
            />

            <FormInput
              label="Model *"
              value={values.model}
              onChangeText={handleChange('model')}
              onBlur={handleBlur('model')}
              placeholder="Enter product model"
              error={errors.model}
              touched={touched.model}
            />

            <FormInput
              label="Invoice Number (Optional)"
              value={values.invoiceNo}
              onChangeText={handleChange('invoiceNo')}
              onBlur={handleBlur('invoiceNo')}
              placeholder="Enter invoice number if available"
            />

            {/* Date/Time Picker */}
            <View style={styles.datePickerContainer}>
              <Text style={styles.label}>Preferred Date/Time (Optional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setTempDate(values.preferredAt || new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {values.preferredAt
                    ? values.preferredAt.toLocaleString()
                    : 'Select date and time'}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    setTempDate(selectedDate);
                    if (Platform.OS === 'android') {
                      setFieldValue('preferredAt', selectedDate);
                    }
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.iosDatePickerButtons}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerConfirm]}
                  onPress={() => {
                    setFieldValue('preferredAt', tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[styles.datePickerButtonText, styles.confirmText]}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
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
      )}
    </Formik>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  datePickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  calendarIcon: {
    fontSize: 20,
  },
  iosDatePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  datePickerConfirm: {
    backgroundColor: '#3498db',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  confirmText: {
    color: '#fff',
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
});

