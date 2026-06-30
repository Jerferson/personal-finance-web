export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  transferDate: string;
  description: string;
}

export interface Transfer {
  id: string;
  date: string;
  description: string;
  amount: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  createdAt: string;
}
