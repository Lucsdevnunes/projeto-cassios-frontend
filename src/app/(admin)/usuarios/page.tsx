'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Key,
  ShieldCheck 
} from 'lucide-react';

interface UserAccount {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'TECNICO';
  ativo: boolean;
  criadoEm: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'ADMIN' | 'TECNICO'>('TECNICO');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    // Double check user permission
    if (currentUser?.perfil !== 'ADMIN') {
      setError('Apenas administradores podem acessar a gestão de usuários.');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/users');
      setUsers(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('TECNICO');
    setAtivo(true);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (account: UserAccount) => {
    setEditingUser(account);
    setNome(account.nome);
    setEmail(account.email);
    setSenha(''); // Keep blank to not change password
    setPerfil(account.perfil);
    setAtivo(account.ativo);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!editingUser && senha.length < 6) {
      setFormError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setFormSubmitting(true);

    const payload: any = {
      nome,
      email,
      perfil,
      ativo,
    };

    if (senha.trim()) {
      payload.senha = senha;
    }

    try {
      if (editingUser) {
        await ApiClient.patch(`/users/${editingUser.id}`, payload);
      } else {
        await ApiClient.post('/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta de administrador.');
      return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta conta de usuário? Ele não poderá mais logar no sistema.')) {
      return;
    }

    try {
      await ApiClient.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário.');
    }
  };

  if (currentUser?.perfil !== 'ADMIN') {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
        <ShieldAlert className="shrink-0" size={18} />
        <span>Acesso Restrito: Apenas administradores do sistema têm permissão para acessar esta seção.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Usuários</h2>
          <p className="text-slate-400 text-sm mt-1">Gestão de acessos de técnicos e administradores</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20 cursor-pointer text-white"
        >
          <Plus size={18} />
          Cadastrar Usuário
        </button>
      </div>

      {/* Main Listing Panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Carregando usuários...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-400 text-sm">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nome</th>
                  <th className="p-4 font-semibold">E-mail</th>
                  <th className="p-4 font-semibold">Perfil</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Criado em</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {users.map((acc) => (
                  <tr key={acc.id} className="text-slate-300 hover:bg-slate-850/30">
                    <td className="p-4 font-bold text-slate-200 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700">
                        {acc.nome.charAt(0).toUpperCase()}
                      </div>
                      {acc.nome}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">{acc.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full inline-block font-bold text-[10px] ${
                        acc.perfil === 'ADMIN' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {acc.perfil === 'ADMIN' ? 'Administrador' : 'Técnico'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${
                        acc.ativo ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {acc.ativo ? <UserCheck size={14} /> : <UserX size={14} />}
                        {acc.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(acc.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        {acc.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(acc.id)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* USER FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? 'Editar Conta de Usuário' : 'Cadastrar Novo Usuário'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="EX: Carlos Henrique"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="EX: carlos@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">Senha</label>
                  {editingUser && (
                    <span className="text-[10px] text-slate-500 font-semibold">(Deixe em branco para manter)</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="No mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                  <Key size={16} className="absolute right-3.5 top-3.5 text-slate-600" />
                </div>
              </div>

              {/* Profile Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Perfil de Acesso</label>
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as 'ADMIN' | 'TECNICO')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                >
                  <option value="TECNICO">Técnico (Operador)</option>
                  <option value="ADMIN">Administrador (Total)</option>
                </select>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 mt-4">
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Usuário Ativo</span>
                  <span className="text-[10px] text-slate-500">Inativar impede o login do usuário</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAtivo(!ativo)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-200 flex items-center cursor-pointer ${
                    ativo ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md"></div>
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 disabled:bg-blue-600/50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : (
                    'Salvar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
