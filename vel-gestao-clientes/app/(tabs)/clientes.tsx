import React, { useEffect, useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  LoadingSpinner, 
  SearchBar,
  Button,
  Modal,
  Input,
  EmptyState
} from '@/components/ui';
import { useClientsStore } from '@/store/clients';
import { useUIStore } from '@/store/ui';
import { Client, CreateClientData } from '@/types';

export default function ClientesScreen() {
  const { 
    clients, 
    loading, 
    error, 
    filters,
    selectedClient,
    fetchClients, 
    addClient, 
    editClient, 
    removeClient,
    setSelectedClient,
    setFilters,
    clearError 
  } = useClientsStore();
  
  const { theme } = useUIStore();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<CreateClientData>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    observacoes: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateClientData>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRefresh = () => {
    fetchClients();
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateClientData> = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!formData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      if (modalMode === 'create') {
        await addClient(formData);
      } else if (selectedClient) {
        await editClient(selectedClient.id.toString(), formData);
      }
      
      setShowModal(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      nome: client.nome,
      email: client.email,
      telefone: client.telefone,
      empresa: client.empresa || '',
      observacoes: client.observacoes || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = (client: Client) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o cliente "${client.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeClient(client.id.toString());
              fetchClients();
            } catch (error) {
              console.error('Erro ao excluir cliente:', error);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      observacoes: ''
    });
    setFormErrors({});
    setSelectedClient(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const filteredClients = clients.filter(client => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        client.nome.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.empresa?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && clients.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Clientes
          </Text>
          <Button
            onPress={handleCreateNew}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <View className="flex-row items-center">
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Novo</Text>
            </View>
          </Button>
        </View>
        
        <SearchBar
          value={filters.search || ''}
          onChangeText={(text) => setFilters({ search: text })}
          placeholder="Buscar clientes..."
        />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        <View className="p-4">
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent>
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text className="text-red-600 ml-2 flex-1">{error}</Text>
                  <TouchableOpacity onPress={clearError}>
                    <Ionicons name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          )}

          {filteredClients.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Nenhum cliente encontrado"
              description={filters.search ? "Tente ajustar sua busca" : "Adicione seu primeiro cliente"}
              actionText="Novo Cliente"
              onAction={handleCreateNew}
            />
          ) : (
            <View className="space-y-3">
              {filteredClients.map((client) => (
                <Card key={client.id} className="bg-white dark:bg-gray-800">
                  <CardContent>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {client.nome}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-300 mb-1">
                          {client.email}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-300 mb-1">
                          {client.telefone}
                        </Text>
                        {client.empresa && (
                          <Text className="text-gray-500 dark:text-gray-400 text-sm">
                            {client.empresa}
                          </Text>
                        )}
                      </View>
                      
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          onPress={() => handleEdit(client)}
                          className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg"
                        >
                          <Ionicons name="pencil" size={16} color="#3b82f6" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDelete(client)}
                          className="p-2 bg-red-100 dark:bg-red-900 rounded-lg"
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Formulário */}
      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={modalMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
      >
        <ScrollView className="max-h-96">
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome *
              </Text>
              <Input
                value={formData.nome}
                onChangeText={(text) => setFormData({ ...formData, nome: text })}
                placeholder="Nome do cliente"
                error={formErrors.nome}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </Text>
              <Input
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={formErrors.email}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone *
              </Text>
              <Input
                value={formData.telefone}
                onChangeText={(text) => setFormData({ ...formData, telefone: text })}
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                error={formErrors.telefone}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empresa
              </Text>
              <Input
                value={formData.empresa}
                onChangeText={(text) => setFormData({ ...formData, empresa: text })}
                placeholder="Nome da empresa"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </Text>
              <Input
                value={formData.observacoes}
                onChangeText={(text) => setFormData({ ...formData, observacoes: text })}
                placeholder="Observações sobre o cliente"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        <View className="flex-row space-x-3 mt-6">
          <Button
            onPress={() => {
              setShowModal(false);
              resetForm();
            }}
            className="flex-1 bg-gray-200 dark:bg-gray-700"
          >
            <Text className="text-gray-800 dark:text-gray-200 font-medium text-center">
              Cancelar
            </Text>
          </Button>
          
          <Button
            onPress={handleSave}
            className="flex-1 bg-blue-600"
            disabled={loading}
          >
            <Text className="text-white font-medium text-center">
              {loading ? 'Salvando...' : 'Salvar'}
            </Text>
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}