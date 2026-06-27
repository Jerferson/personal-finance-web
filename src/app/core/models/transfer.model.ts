export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  transferDate: string;
  description: string;
}

export interface Transfer extends CreateTransferDto {
  id: string;
  journalEntryId: string;
  createdAt: string;
}
