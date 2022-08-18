import SuggestionList from '../suggestion-list';
import { Form } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import { _t } from '../../i18n';

interface Props {
  className: string;
  value: string;
  setValue: (value: string) => void;
}

interface Item {
  value: string;
  title: string;
}

export const PurchaseQrTypes = ({ value, setValue, className }: Props) => {
  const [input, setInput] = useState('');
  const items: Item[] = [
    { value: '099points', title: _t('purchase-qr.points-amount', { n: '099' }) },
    { value: '199points', title: _t('purchase-qr.points-amount', { n: '199' }) },
    { value: '499points', title: _t('purchase-qr.points-amount', { n: '499' }) },
    { value: '999points', title: _t('purchase-qr.points-amount', { n: '999' }) },
    { value: '4999points', title: _t('purchase-qr.points-amount', { n: '4999' }) },
    { value: '9999points', title: _t('purchase-qr.points-amount', { n: '9999' }) },
  ];
  useEffect(() => {
    setInput(items.find(i => i.value === value)!.title);
  }, [value]);

  useEffect(() => {
    const existing = items.find(item => item.value === input);
    if (existing) {
      setValue(existing.value);
    }
  }, [input]);

  const suggestionProps = {
    renderer: (i: Item) => {
      return <span>{i.title}</span>;
    },
    onSelect: (selected: Item) => {
      setValue(selected.value);
    },
    ignoreFirstInputFocus: true,
  };

  return <SuggestionList containerClassName={className} items={items} {...suggestionProps}>
    <Form.Control
      type="text"
      autoFocus={true}
      placeholder={_t('purchase-qr.select-amount')}
      value={input}
      onChange={(e) => setInput(e.target.value)}
    />
  </SuggestionList>
}