"use client";

import { useState } from 'react';
import { Payee } from '@/types/finance';

export const usePayeeManagement = (isAccount: boolean) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [payeesToDelete, setPayeesToDelete] = useState<Payee[]>([]);

  const handleAdd = () => {
    setSelectedPayee(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (payee: Payee) => {
    setSelectedPayee(payee);
    setIsDialogOpen(true);
  };

  const handleDelete = (payee: Payee) => {
    setPayeesToDelete([payee]);
    setIsDeleteConfirmOpen(true);
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    selectedPayee,
    setSelectedPayee,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    payeesToDelete,
    setPayeesToDelete,
    handleAdd,
    handleEdit,
    handleDelete,
  };
};