import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, MapPin, Package, Plus, Trash2, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { BD_DISTRICTS } from '@shared/constants';
import { formatBdt, formatDateDhaka } from '@shared/format';
import { addressSchema, profileUpdateSchema } from '@shared/schemas';
import { PageMeta } from '@/components/ui/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import {
  useAddresses,
  useOrders,
  useProfile,
  useShippingZones,
} from '@/hooks/useStore';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';

type AddressFormValues = z.infer<typeof addressSchema>;
type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export default function AccountPage() {
  const { orderNumber } = useParams<{ orderNumber?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { isDemoMode, isGuest, isAuthenticated, signOut, updatePassword } = useAuth();

  const { data: profile } = useProfile();
  const { data: orders = [] } = useOrders();
  const { data: addresses = [] } = useAddresses();
  const { data: zones = [] } = useShippingZones();

  const activeTab: 'profile' | 'orders' | 'addresses' = location.pathname.includes('/orders')
    ? 'orders'
    : location.pathname.includes('/addresses')
      ? 'addresses'
      : 'profile';

  const [newPassword, setNewPassword] = useState('');
  const [showAddrForm, setShowAddrForm] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { fullName: '', phone: '' },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, profileForm]);

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      recipientName: '',
      phone: '',
      zoneCode: 'dhaka_city',
      district: 'Dhaka',
      thana: '',
      addressLine: '',
      landmark: '',
      postalCode: '',
      isDefault: true,
    },
  });

  const handleSaveProfile = async (values: ProfileFormValues) => {
    try {
      await apiClient.updateProfile(values);
      await qc.invalidateQueries({ queryKey: ['profile'] });
      showToast('Profile saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update profile', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      showToast('Password updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update password', 'error');
    }
  };

  const handleCreateAddress = async (values: AddressFormValues) => {
    try {
      await apiClient.createAddress(values);
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      addressForm.reset();
      setShowAddrForm(false);
      showToast('Address saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save address', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await apiClient.deleteAddress(id);
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      showToast('Address removed', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove address', 'error');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await apiClient.updateAddress(id, { isDefault: true });
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      showToast('Default address updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update default', 'error');
    }
  };

  const selectedOrder = orderNumber
    ? orders.find((o) => o.orderNumber === orderNumber) ?? null
    : null;

  return (
    <>
      <PageMeta title="My Account" description="Manage your Paper Bloom profile, saved addresses, and demo orders." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dec0b7] mb-8">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#181d1a]">My Account</h1>
            <p className="text-sm text-[#525954] mt-1">
              {isDemoMode
                ? 'Demo Preview Session (saved in this browser)'
                : isGuest
                  ? 'Guest Session'
                  : profile?.email || 'Signed-in Customer'}
            </p>
          </div>

          {!isDemoMode && isAuthenticated && (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-[#dec0b7] text-xs font-semibold text-[#9f3c16] hover:bg-[#fff5f2] self-start"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          )}
        </div>

        {!isDemoMode && isGuest && (
          <div className="mb-8 rounded-2xl bg-[#eef4ed] border border-[#476553]/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-[#181d1a]">
              You are browsing as a <strong>Guest</strong>. Upgrade to a full account to keep your orders and addresses across devices.
            </p>
            <Link
              to="/register"
              className="px-4 py-2 rounded-full bg-[#476553] text-white text-xs font-semibold whitespace-nowrap text-center"
            >
              Upgrade to Full Account
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#dec0b7] p-3 space-y-1">
            <Link
              to="/account"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
                activeTab === 'profile'
                  ? 'bg-[#9f3c16]/10 text-[#9f3c16]'
                  : 'text-[#181d1a] hover:bg-[#faf6f0]'
              }`}
            >
              <User className="w-4 h-4" />
              Profile &amp; Security
            </Link>
            <Link
              to="/account/orders"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
                activeTab === 'orders'
                  ? 'bg-[#9f3c16]/10 text-[#9f3c16]'
                  : 'text-[#181d1a] hover:bg-[#faf6f0]'
              }`}
            >
              <Package className="w-4 h-4" />
              Demo Orders ({orders.length})
            </Link>
            <Link
              to="/account/addresses"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
                activeTab === 'addresses'
                  ? 'bg-[#9f3c16]/10 text-[#9f3c16]'
                  : 'text-[#181d1a] hover:bg-[#faf6f0]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Addresses ({addresses.length})
            </Link>
          </aside>

          {/* Main Panel */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === 'profile' && (
              <>
                <form
                  onSubmit={profileForm.handleSubmit(handleSaveProfile)}
                  className="bg-white rounded-2xl border border-[#dec0b7] p-6 space-y-4"
                >
                  <h2 className="font-editorial text-2xl text-[#181d1a]">Profile Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="acc-name" className="block text-xs font-semibold mb-1">
                        Full Name
                      </label>
                      <input
                        id="acc-name"
                        type="text"
                        {...profileForm.register('fullName')}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                      />
                      {profileForm.formState.errors.fullName && (
                        <p className="mt-1 text-xs text-[#9f3c16]">
                          {profileForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="acc-phone" className="block text-xs font-semibold mb-1">
                        Bangladesh Mobile Number
                      </label>
                      <input
                        id="acc-phone"
                        type="tel"
                        {...profileForm.register('phone')}
                        placeholder="01712345678"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                      />
                      {profileForm.formState.errors.phone && (
                        <p className="mt-1 text-xs text-[#9f3c16]">
                          {profileForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 h-11 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c]"
                  >
                    Save Profile
                  </button>
                </form>

                {!isDemoMode && isAuthenticated && !isGuest && (
                  <form
                    onSubmit={handlePasswordChange}
                    className="bg-white rounded-2xl border border-[#dec0b7] p-6 space-y-4"
                  >
                    <h2 className="font-editorial text-2xl text-[#181d1a]">Change Password</h2>
                    <div className="max-w-sm">
                      <label htmlFor="acc-new-pw" className="block text-xs font-semibold mb-1">
                        New Password (8+ characters)
                      </label>
                      <input
                        id="acc-new-pw"
                        type="password"
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 h-11 rounded-full border border-[#9f3c16] text-[#9f3c16] text-sm font-medium hover:bg-[#9f3c16] hover:text-white transition-colors"
                    >
                      Update Password
                    </button>
                  </form>
                )}
              </>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-[#dec0b7] p-6 space-y-4">
                {selectedOrder ? (
                  <div className="space-y-4">
                    <Link
                      to="/account/orders"
                      className="text-xs font-semibold text-[#9f3c16] hover:underline"
                    >
                      &larr; All Demo Orders
                    </Link>
                    <div className="flex flex-wrap justify-between gap-2 pb-4 border-b border-[#eadcd6]">
                      <div>
                        <h2 className="font-editorial text-2xl text-[#181d1a] tabular-nums">
                          Order {selectedOrder.orderNumber}
                        </h2>
                        <p className="text-xs text-[#525954]">
                          {formatDateDhaka(selectedOrder.createdAt)} · {selectedOrder.shippingAddress.zoneName}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#eef4ed] text-[#476553] text-xs font-semibold capitalize self-start">
                        {selectedOrder.status} (Demo)
                      </span>
                    </div>
                    <ul className="divide-y divide-[#eadcd6]">
                      {selectedOrder.items.map((item) => (
                        <li key={item.id} className="py-3 flex justify-between text-sm">
                          <div>
                            <p className="font-medium">
                              {item.name} × {item.quantity}
                            </p>
                            <p className="text-xs text-[#525954]">{item.variantName}</p>
                            {item.personalization?.text && (
                              <p className="text-xs text-[#9f3c16]">
                                Custom: “{item.personalization.text}”
                              </p>
                            )}
                          </div>
                          <span className="font-semibold tabular-nums">
                            {formatBdt(item.lineTotalBdt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t border-[#dec0b7] flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="tabular-nums">{formatBdt(selectedOrder.totalBdt)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-editorial text-2xl text-[#181d1a]">Demo Order History</h2>
                    {orders.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-[#525954] mb-4">
                          You have not placed any demonstration orders yet.
                        </p>
                        <Link
                          to="/shop"
                          className="inline-flex px-5 py-2.5 rounded-full bg-[#9f3c16] text-white text-xs font-medium"
                        >
                          Browse Stationery
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#eadcd6]">
                        {orders.map((o) => (
                          <div
                            key={o.id}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <Link
                                to={`/account/orders/${encodeURIComponent(o.orderNumber)}`}
                                className="font-semibold text-sm text-[#181d1a] hover:text-[#9f3c16] tabular-nums"
                              >
                                {o.orderNumber}
                              </Link>
                              <p className="text-xs text-[#525954]">
                                {formatDateDhaka(o.createdAt)} · {o.items.length} item(s) ·{' '}
                                <span className="capitalize">{o.status}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-sm tabular-nums">
                                {formatBdt(o.totalBdt)}
                              </span>
                              <Link
                                to={`/account/orders/${encodeURIComponent(o.orderNumber)}`}
                                className="px-4 py-1.5 rounded-full border border-[#dec0b7] text-xs font-medium hover:bg-[#faf6f0]"
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-[#dec0b7] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl text-[#181d1a]">Saved Addresses</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddrForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#9f3c16] text-white text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                </div>

                {showAddrForm && (
                  <form
                    onSubmit={addressForm.handleSubmit(handleCreateAddress)}
                    className="p-5 rounded-2xl bg-[#faf6f0] border border-[#dec0b7] space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Label (e.g. Home)"
                        {...addressForm.register('label')}
                        className="h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Recipient Name"
                        {...addressForm.register('recipientName')}
                        className="h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                      />
                      <input
                        type="tel"
                        placeholder="01712345678"
                        {...addressForm.register('phone')}
                        className="h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        {...addressForm.register('zoneCode')}
                        className="h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                      >
                        {zones.map((z) => (
                          <option key={z.code} value={z.code}>{z.name}</option>
                        ))}
                      </select>
                      <select
                        {...addressForm.register('district')}
                        className="h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                      >
                        {BD_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Area / Thana"
                        {...addressForm.register('thana')}
                        className="h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="House, Road, Flat Address"
                      {...addressForm.register('addressLine')}
                      className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          {...addressForm.register('isDefault')}
                          className="accent-[#9f3c16]"
                        />
                        Set as default address
                      </label>
                      <button
                        type="submit"
                        className="px-5 h-10 rounded-full bg-[#9f3c16] text-white text-xs font-semibold"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-sm text-[#525954]">No saved addresses yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-2xl border border-[#dec0b7] bg-[#f6fbf5] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#9f3c16]">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[11px] font-medium text-[#476553]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm text-[#181d1a] mt-1">
                            {addr.recipientName}
                          </p>
                          <p className="text-xs text-[#525954] tabular-nums">{addr.phone}</p>
                          <p className="text-xs text-[#525954] mt-1">
                            {addr.addressLine}, {addr.thana}, {addr.district}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#eadcd6] text-xs">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[#476553] font-medium hover:underline"
                            >
                              Make default
                            </button>
                          ) : (
                            <span />
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            aria-label="Delete address"
                            className="inline-flex items-center gap-1 text-[#9f3c16] hover:underline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
