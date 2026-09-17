"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SupplierFormValues {
  /*
   * Optional - left out on create so the backend generates one
   * (SUP00001, SUP00002, ...). Still editable once a supplier
   * exists, in case a typo needs fixing.
   */
  supplierCode?: string;

  name: string;

  gstType: string;

  gstin?: string;

  mobile?: string;

  email?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  openingBalance: number;

  isActive: boolean;
}

interface SupplierFormProps {
  defaultValues?: SupplierFormValues;

  loading?: boolean;

  onSubmit(values: SupplierFormValues): void;
}

export default function SupplierForm({
  defaultValues,
  loading,
  onSubmit,
}: SupplierFormProps) {
  const [supplierCode, setSupplierCode] =
    useState("");

  const [name, setName] = useState("");

  const [gstType, setGstType] =
    useState("Registered");

  const [gstin, setGstin] = useState("");

  const [mobile, setMobile] = useState("");

  const [email, setEmail] = useState("");

  const [address, setAddress] = useState("");

  const [city, setCity] = useState("");

  const [state, setState] = useState("");

  const [pincode, setPincode] = useState("");

  const [openingBalance, setOpeningBalance] =
    useState("0");

  const [isActive, setIsActive] =
    useState(true);

  const isEditMode = Boolean(defaultValues);

  useEffect(() => {
    if (defaultValues) {
      setSupplierCode(defaultValues.supplierCode ?? "");

      setName(defaultValues.name);

      setGstType(defaultValues.gstType);

      setGstin(defaultValues.gstin ?? "");

      setMobile(defaultValues.mobile ?? "");

      setEmail(defaultValues.email ?? "");

      setAddress(defaultValues.address ?? "");

      setCity(defaultValues.city ?? "");

      setState(defaultValues.state ?? "");

      setPincode(defaultValues.pincode ?? "");

      setOpeningBalance(
        String(defaultValues.openingBalance),
      );

      setIsActive(defaultValues.isActive);
    } else {
      setSupplierCode("");
      setName("");
      setGstType("Registered");
      setGstin("");
      setMobile("");
      setEmail("");
      setAddress("");
      setCity("");
      setState("");
      setPincode("");
      setOpeningBalance("0");
      setIsActive(true);
    }
  }, [defaultValues]);
    return (
    <form
      id="supplier-form"
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          supplierCode: isEditMode
            ? supplierCode
            : undefined,
          name,
          gstType,
          gstin,
          mobile,
          email: email || undefined,
          address,
          city,
          state,
          pincode,
          openingBalance: Number(openingBalance),
          isActive,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">

        {isEditMode ? (
          <div className="space-y-2">
            <Label>Supplier Code</Label>
            <Input
              value={supplierCode}
              disabled={loading}
              onChange={(e) =>
                setSupplierCode(e.target.value)
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Supplier Code</Label>
            <Input
              value="Generated automatically"
              disabled
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Supplier Name</Label>
          <Input
            value={name}
            disabled={loading}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>GST Type</Label>

          <Select
            value={gstType}
            onValueChange={setGstType}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Registered">
                Registered
              </SelectItem>

              <SelectItem value="Unregistered">
                Unregistered
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>GSTIN</Label>
          <Input
            value={gstin}
            disabled={loading}
            onChange={(e) =>
              setGstin(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Mobile</Label>
          <Input
            value={mobile}
            disabled={loading}
            onChange={(e) =>
              setMobile(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={email}
            disabled={loading}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Address</Label>
          <Input
            value={address}
            disabled={loading}
            onChange={(e) =>
              setAddress(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={city}
            disabled={loading}
            onChange={(e) =>
              setCity(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={state}
            disabled={loading}
            onChange={(e) =>
              setState(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input
            value={pincode}
            disabled={loading}
            onChange={(e) =>
              setPincode(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Opening Balance</Label>
          <Input
            type="number"
            value={openingBalance}
            disabled={loading}
            onChange={(e) =>
              setOpeningBalance(e.target.value)
            }
          />
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={isActive}
            onChange={(e) =>
              setIsActive(e.target.checked)
            }
          />

          <Label htmlFor="active">
            Active Supplier
          </Label>
        </div>

      </div>
    </form>
  );
}