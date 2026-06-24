import type { FormEvent } from 'react';
import type { PropertyRow } from '@/components/catalog/types';

interface EnquiryForm {
  name: string;
  email: string;
  message: string;
}

interface PropertyDetailsModalProps {
  property: PropertyRow;
  enquirySent: boolean;
  enquiryForm: EnquiryForm;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEnquiryFormChange: (form: EnquiryForm) => void;
}

export default function PropertyDetailsModal({
  property,
  enquirySent,
  enquiryForm,
  onClose,
  onSubmit,
  onEnquiryFormChange,
}: PropertyDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col md:flex-row my-8 max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-9 h-9 bg-[#1d1d1f] hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="md:w-1/2 relative bg-slate-100 min-h-[250px] md:min-h-full">
          <img
            src={property.images?.[0]?.image_url || ''}
            alt={property.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 text-white space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/70 bg-white/10 backdrop-blur px-2.5 py-1 rounded-full font-bold">
              {property.city} • {property.heating_type}
            </span>
            <h3 className="font-serif text-2xl font-bold mt-2">{property.title}</h3>
            <p className="text-white/60 text-xs font-light">{property.street_address}</p>
          </div>
        </div>

        <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto text-left flex flex-col justify-between space-y-8 max-h-[80vh] md:max-h-none">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Property overview</span>
              <p className="text-xs text-slate-600 font-light leading-relaxed">{property.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-black/[0.04] py-4 text-xs">
              <div>
                <span className="text-slate-400 block">Living area:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.area_sqm} sqm</p>
              </div>
              <div>
                <span className="text-slate-400 block">Rooms:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.rooms_count}</p>
              </div>
              <div>
                <span className="text-slate-400 block">Available from:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.created_at}</p>
              </div>
              <div>
                <span className="text-slate-400 block">Deposit:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.deposit_amount} EUR</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Amenities</span>
              <div className="flex flex-wrap gap-1.5">
                {(property.amenities_text
                  ? property.amenities_text.split(',').map((item) => item.trim()).filter(Boolean)
                  : []
                ).map((amenity) => (
                  <span key={amenity} className="bg-[#f5f5f7] text-[#1d1d1f] text-[10px] font-medium px-3 py-1 rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.04] pt-6 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Monthly cold rent</span>
                <span className="text-2xl font-serif font-bold text-[#1d1d1f]">
                  {property.base_rent} EUR <span className="text-xs font-sans font-light text-slate-400">/ month</span>
                </span>
              </div>
            </div>

            {enquirySent ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center space-y-1 py-6">
                <span className="text-xl">Success</span>
                <p className="font-semibold">Enquiry sent successfully.</p>
                <p className="text-[10px] text-emerald-600 font-light">An agent will contact you with next steps.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-slate-400 font-bold block">Message to landlord</label>
                  <textarea
                    required
                    rows={2}
                    value={enquiryForm.message}
                    onChange={(event) => onEnquiryFormChange({ ...enquiryForm, message: event.target.value })}
                    placeholder={`Hello, I am interested in ${property.title}.`}
                    className="w-full text-xs p-3 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1d1d1f] hover:bg-black text-white py-3 rounded-full text-xs font-semibold transition active:scale-95 shadow-lg shadow-black/5"
                >
                  Contact agent
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
