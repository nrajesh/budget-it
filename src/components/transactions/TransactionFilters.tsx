"use client";

import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import React from "react";

interface TransactionFiltersProps {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  accountFilter: string;
  onAccountFilterChange: (account: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  vendorFilter: string;
  onVendorFilterChange: (vendor: string) => void;
  searchTerm: string; // Added searchTerm prop
  setSearchTerm: (term: string) => void; // Added setSearchTerm prop
  onResetFilters: () => void;
  accounts: string[];
  categories: string[];
  vendors: string[];
}

export function TransactionFilters({
  dateRange,
  onDateChange,
  accountFilter,
  onAccountFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  vendorFilter,
  onVendorFilterChange,
  searchTerm, // Destructure searchTerm
  setSearchTerm, // Destructure setSearchTerm
  onResetFilters,
  accounts,
  categories,
  vendors,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 p-4 border-b">
      <div>
        <Label htmlFor="date-range">Date Range</Label>
        <DateRangePicker date={dateRange} setDate={onDateChange} />
      </div>
      <div>
        <Label htmlFor="account-filter">Account</Label>
        <Select value={accountFilter} onValueChange={onAccountFilterChange}>
          <SelectTrigger id="account-filter" className="w-[180px]">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account} value={account}>
                {account}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="category-filter">Category</Label>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger id="category-filter" className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="vendor-filter">Vendor</Label>
        <Select value={vendorFilter} onValueChange={onVendorFilterChange}>
          <SelectTrigger id="vendor-filter" className="w-[180px]">
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>
                {vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="search-term">Search</Label>
        <Input
          id="search-term"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[180px]"
        />
      </div>
      <Button variant="outline" size="icon" onClick={onResetFilters} className="shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}