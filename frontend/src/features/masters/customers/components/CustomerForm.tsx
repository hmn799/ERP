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

import priceListService from "@/services/price-list/price-list.service";

interface PriceList {
  id: string;
  name: string;
}

export interface CustomerFormValues {
  /*
   * Optional - left out on create so the backend generates one
   * (CUS00001, CUS00002, ...). Still editable once a customer
   * exists, in case a typo needs fixing.
   */
  customerCode?: string;

  name: string;

  customerGroup: string;

  priceLevel: string;

  priceListId?: string;

  gstCategory: string;

  gstin?: string;

  mobile?: string;

  email?: string;

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  openingBalance: number;

  creditLimit: number;

  isActive: boolean;
}

interface CustomerFormProps {
  defaultValues?: CustomerFormValues;

  loading?: boolean;

  onSubmit(values: CustomerFormValues): void;
}

export default function CustomerForm({
  defaultValues,
  loading,
  onSubmit,
}: CustomerFormProps) {
  const [customerCode, setCustomerCode] = useState("");

  const [name, setName] = useState("");

  const [customerGroup, setCustomerGroup] =
    useState("Retail");

  const [priceLevel, setPriceLevel] =
    useState("Retail");

  const [priceListId, setPriceListId] =
    useState("");

  const [gstCategory, setGstCategory] =
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

  const [creditLimit, setCreditLimit] =
    useState("0");

  const [isActive, setIsActive] =
    useState(true);

  const [priceLists, setPriceLists] = useState<
    PriceList[]
  >([]);

  const isEditMode = Boolean(defaultValues);

  useEffect(() => {
    priceListService.getAll().then(setPriceLists);
  }, []);

  useEffect(() => {
    if (defaultValues) {
      setCustomerCode(defaultValues.customerCode ?? "");

      setName(defaultValues.name);

      setCustomerGroup(defaultValues.customerGroup);

      setPriceLevel(defaultValues.priceLevel);

      setPriceListId(defaultValues.priceListId ?? "");

      setGstCategory(defaultValues.gstCategory);

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

      setCreditLimit(
        String(defaultValues.creditLimit),
      );

      setIsActive(defaultValues.isActive);
    }
  }, [defaultValues]);
    return (
    <form
      id="customer-form"
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          customerCode: isEditMode
            ? customerCode
            : undefined,
          name,
          customerGroup,
          priceLevel,
          priceListId: priceListId || undefined,
          gstCategory,
          gstin,
          mobile,
          email: email || undefined,
          address,
          city,
          state,
          pincode,
          openingBalance: Number(openingBalance),
          creditLimit: Number(creditLimit),
          isActive,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">

        {isEditMode ? (
          <div className="space-y-2">
            <Label>Customer Code</Label>
            <Input
              value={customerCode}
              disabled={loading}
              onChange={(e) =>
                setCustomerCode(e.target.value)
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Customer Code</Label>
            <Input
              value="Generated automatically"
              disabled
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Customer Name</Label>
          <Input
            value={name}
            disabled={loading}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Customer Group</Label>

          <Select
            value={customerGroup}
            onValueChange={setCustomerGroup}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Retail">
                Retail
              </SelectItem>

              <SelectItem value="Wholesale">
                Wholesale
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>GST Category</Label>

          <Select
            value={gstCategory}
            onValueChange={setGstCategory}
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

        <div className="space-y-2">
          <Label>Price List</Label>

          <Select
            value={priceListId}
            onValueChange={setPriceListId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Price List" />
            </SelectTrigger>

            <SelectContent>
              {priceLists.map((priceList) => (
                <SelectItem
                  key={priceList.id}
                  value={priceList.id}
                >
                  {priceList.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Price Level</Label>

          <Input
            value={priceLevel}
            disabled={loading}
            onChange={(e) =>
              setPriceLevel(e.target.value)
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

        <div className="space-y-2">
          <Label>Credit Limit</Label>

          <Input
            type="number"
            value={creditLimit}
            disabled={loading}
            onChange={(e) =>
              setCreditLimit(e.target.value)
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
            Active Customer
          </Label>
        </div>

      </div>
    </form>
  );
}