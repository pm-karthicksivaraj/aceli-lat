"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_FLAGS, Country } from "@/lib/types";

interface CountryFilterProps {
  selectedCountry: Country | null;
  onCountryChange: (country: Country | null) => void;
}

const COUNTRIES: Country[] = ["Kenya", "Uganda", "Tanzania", "Ethiopia", "Nigeria"];

export function CountryFilter({ selectedCountry, onCountryChange }: CountryFilterProps) {
  return (
    <Select
      value={selectedCountry || "all"}
      onValueChange={(val) => onCountryChange(val === "all" ? null : (val as Country))}
    >
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <SelectValue placeholder="All Countries" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">🌍 All Countries</SelectItem>
        {COUNTRIES.map((country) => (
          <SelectItem key={country} value={country}>
            {COUNTRY_FLAGS[country]} {country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
