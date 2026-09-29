'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, X } from 'lucide-react';
import {
  fetchAdminContacts,
  patchContactStatus,
} from '@/lib/admin/operations-api';
import type { Contact, ContactStatus } from '@/lib/operations/types';
import AdminDbUnavailable, { AdminLoading } from '@/components/admin/AdminDbState';
import AdminBadge, { statusToBadge } from '@/components/admin/ui/AdminBadge';
import AdminButton from '@/components/admin/ui/AdminButton';
import AdminCard from '@/components/admin/ui/AdminCard';
import AdminEmptyState from '@/components/admin/ui/AdminEmptyState';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminSearchInput from '@/components/admin/ui/AdminSearchInput';
import { AdminTableHead, AdminTd, AdminTh, AdminTr, AdminTableWrap } from '@/components/admin/ui/AdminTable';

const PAGE_SIZE = 25;

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDbUnavailable(false);
    try {
      const result = await fetchAdminContacts({
        page,
        pageSize: PAGE_SIZE,
        q: query,
      });
      setContacts(result.contacts);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setDbUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const markRead = async (msg: Contact) => {
    if (msg.status === 'new') {
      await patchContactStatus(msg.id, 'read');
      await load();
    }
    setSelected({ ...msg, status: msg.status === 'new' ? 'read' : msg.status });
  };

  const setStatus = async (id: string, status: ContactStatus) => {
    await patchContactStatus(id, status);
    await load();
  };

  if (loading && contacts.length === 0) return <AdminLoading label="Loading messages…" />;
  if (dbUnavailable) return <AdminDbUnavailable onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        breadcrumb="Operations"
        title="Contact messages"
        description={`${total} inbound messages`}
        actions={
          <AdminSearchInput
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="w-48 lg:w-64"
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard padding={false} className={`${selected ? 'hidden lg:block' : ''} lg:col-span-2`}>
          {contacts.length === 0 ? (
            <AdminEmptyState icon={MessageSquare} title="No messages" />
          ) : (
            <>
              <AdminTableWrap>
                <AdminTableHead>
                  <AdminTh>Name</AdminTh>
                  <AdminTh>Email</AdminTh>
                  <AdminTh>Message</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Date</AdminTh>
                </AdminTableHead>
                <tbody>
                  {contacts.map((msg) => (
                    <AdminTr key={msg.id} className="cursor-pointer" onClick={() => markRead(msg)}>
                      <AdminTd className="font-medium text-slate-800">
                        <span className="inline-flex items-center gap-2">
                          {msg.status === 'new' ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          ) : null}
                          {msg.name}
                        </span>
                      </AdminTd>
                      <AdminTd className="text-slate-600">{msg.email}</AdminTd>
                      <AdminTd className="max-w-xs truncate text-slate-600">{msg.message}</AdminTd>
                      <AdminTd>
                        <AdminBadge variant={statusToBadge(msg.status)}>{msg.status}</AdminBadge>
                      </AdminTd>
                      <AdminTd className="text-xs text-slate-500">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </AdminTd>
                    </AdminTr>
                  ))}
                </tbody>
              </AdminTableWrap>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                  {loading ? ' · refreshing…' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </AdminCard>

        {selected ? (
          <AdminCard className="lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Message detail</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Name</span>
                <span className="font-medium text-slate-800">{selected.name}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Email</span>
                <span className="font-medium text-slate-800">{selected.email}</span>
              </div>
              {selected.phone ? (
                <div>
                  <span className="mb-0.5 block text-xs text-slate-500">Phone</span>
                  <span className="font-medium text-slate-800">{selected.phone}</span>
                </div>
              ) : null}
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Date</span>
                <span className="font-medium text-slate-800">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <hr className="border-slate-100" />
              <div>
                <span className="mb-1 block text-xs text-slate-500">Message</span>
                <p className="leading-relaxed text-slate-700">{selected.message}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.status === 'new' ? (
                <AdminButton
                  variant="primary"
                  className="h-9 px-3 text-xs"
                  onClick={() => setStatus(selected.id, 'read')}
                >
                  Mark read
                </AdminButton>
              ) : null}
              <AdminButton variant="secondary" href={`mailto:${selected.email}`} className="h-9 px-3 text-xs">
                Reply via email
              </AdminButton>
            </div>
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}
