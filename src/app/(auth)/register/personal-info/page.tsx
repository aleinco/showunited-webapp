'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select, Title, Text, RadioGroup, AdvancedRadio } from 'rizzui';
import toast from 'react-hot-toast';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const COUNTRY_CODES = [
  { code: '+34', flag: '\u{1F1EA}\u{1F1F8}', country: 'Spain' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', country: 'United States' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', country: 'United Kingdom' },
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', country: 'France' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', country: 'Germany' },
  { code: '+39', flag: '\u{1F1EE}\u{1F1F9}', country: 'Italy' },
  { code: '+351', flag: '\u{1F1F5}\u{1F1F9}', country: 'Portugal' },
  { code: '+31', flag: '\u{1F1F3}\u{1F1F1}', country: 'Netherlands' },
  { code: '+55', flag: '\u{1F1E7}\u{1F1F7}', country: 'Brazil' },
  { code: '+52', flag: '\u{1F1F2}\u{1F1FD}', country: 'Mexico' },
  { code: '+54', flag: '\u{1F1E6}\u{1F1F7}', country: 'Argentina' },
  { code: '+91', flag: '\u{1F1EE}\u{1F1F3}', country: 'India' },
  { code: '+81', flag: '\u{1F1EF}\u{1F1F5}', country: 'Japan' },
  { code: '+61', flag: '\u{1F1E6}\u{1F1FA}', country: 'Australia' },
  { code: '+90', flag: '\u{1F1F9}\u{1F1F7}', country: 'Turkey' },
  { code: '+971', flag: '\u{1F1E6}\u{1F1EA}', country: 'UAE' },
  { code: '+212', flag: '\u{1F1F2}\u{1F1E6}', country: 'Morocco' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

export default function PersonalInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [callingCode, setCallingCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [internationalTouring, setInternationalTouring] = useState(true);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  async function handleContinue() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }

    const userId =
      typeof window !== 'undefined'
        ? localStorage.getItem('su_register_userId') || ''
        : '';
    const userType =
      typeof window !== 'undefined'
        ? localStorage.getItem('su_register_userType') || 'IndividualUser'
        : 'IndividualUser';

    setLoading(true);
    try {
      const endpoint =
        userType === 'CompanyUser'
          ? 'CompanyRegistration1'
          : 'IndividualRegistration1';

      const payload =
        userType === 'CompanyUser'
          ? {
              name: firstName,
              companyEmail:
                typeof window !== 'undefined'
                  ? localStorage.getItem('su_register_email') || ''
                  : '',
              contactNumber: phone,
              website: '',
              contactPersonName: `${firstName} ${lastName}`,
              contactPersonEmail:
                typeof window !== 'undefined'
                  ? localStorage.getItem('su_register_email') || ''
                  : '',
              contactPersonContactNumber: phone,
            }
          : {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              countryCallingCode: callingCode.code,
              phoneNumber: phone,
              gender,
              countryId: country,
              cityId: city,
              bithDate: birthDate ? birthDate.toISOString() : null,
              isInterestedInInternationalTouring: internationalTouring,
            };

      const res = await axios.post('/api/user', {
        endpoint,
        token,
        data: payload,
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        toast.success('Personal info saved');
        router.push('/register/categories');
      } else {
        toast.error(data.responseMessage || 'Failed to save. Please try again.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Top nav */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/signin">
          <img
            src="/logo-showunited.png"
            alt="Show United"
            className="h-10 w-auto"
          />
        </Link>
        <Text as="span" className="text-nowrap font-medium text-gray-500">
          Step 4 of 7
        </Text>
      </div>

      <div className="mx-auto w-full max-w-sm md:max-w-lg">
        <Title as="h3" className="mb-6 font-inter text-xl font-medium md:text-2xl">
          Personal info
        </Title>

        <div className="space-y-4">
          <Input
            label="First Name"
            placeholder="First Name"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <Input
            label="Last Name"
            placeholder="Last Name"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          {/* Phone with country code */}
          <div>
            <Text className="mb-1.5 text-sm font-medium text-gray-900">
              Phone Number
            </Text>
            <div className="flex gap-2">
              <Select
                options={COUNTRY_CODES.map((c) => ({
                  label: `${c.flag} ${c.code}`,
                  value: c.code,
                }))}
                value={callingCode.code}
                onChange={(opt: any) => {
                  const found = COUNTRY_CODES.find((c) => c.code === (opt?.value || opt));
                  if (found) setCallingCode(found);
                }}
                className="w-32 shrink-0"
                size="lg"
              />
              <Input
                type="tel"
                placeholder="Phone Number"
                inputClassName="text-sm"
                size="lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1"
                suffix={
                  <Text className="text-xs text-gray-400">
                    {phone.length}/9
                  </Text>
                }
              />
            </div>
          </div>

          {/* Gender */}
          <Select
            label="Gender"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(opt: any) => setGender(opt?.value || opt)}
            placeholder="Select Gender"
            className="[&>label>span]:font-medium"
            size="lg"
          />

          {/* Country - text input */}
          <Input
            label="Country"
            placeholder="Country"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          {/* City - text input */}
          <Input
            label="City"
            placeholder="City"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          {/* Birthdate */}
          <div>
            <Text className="mb-1.5 text-sm font-medium text-gray-900">
              Birthdate
            </Text>
            <DatePicker
              selected={birthDate}
              onChange={(date) => setBirthDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="birthdate"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              maxDate={new Date()}
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-[#F26B50] focus:outline-none focus:ring-1 focus:ring-[#F26B50]"
            />
          </div>

          {/* International Touring */}
          <div>
            <Text className="mb-3 text-base font-medium text-gray-900">
              Interested for International Touring?
            </Text>
            <RadioGroup
              value={internationalTouring ? 'yes' : 'no'}
              setValue={(val: string) => setInternationalTouring(val === 'yes')}
              className="flex gap-6"
            >
              <AdvancedRadio
                value="yes"
                inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&:checked~span]:ring-2 [&:checked~span]:ring-[#F26B50]"
              >
                <Text className="px-4 py-2 font-medium">Yes</Text>
              </AdvancedRadio>
              <AdvancedRadio
                value="no"
                inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&:checked~span]:ring-2 [&:checked~span]:ring-[#F26B50]"
              >
                <Text className="px-4 py-2 font-medium">No</Text>
              </AdvancedRadio>
            </RadioGroup>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!firstName.trim() || !lastName.trim()}
          isLoading={loading}
          className="mt-8 w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
