import React, { useEffect } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  LoadingSpinner, 
  Badge,
  CustomBarChart,
  CustomLineChart,
  CustomPieChart
} from '@/components/ui';
import { useDashboardStore } from '@/store/dashboard';
import { useUIStore } from '@/store/ui';

export default function DashboardScreen() {
  const {
    kpis,
    recentItems,
    projectStatusDistribution,
    chartData,
    loading,
    error,
    fetchDashboardData,
    refreshDashboard,
  } = useDashboardStore();

  const { theme } = useUIStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = async () => {
    await refreshDashboard();
  };

  if (loading && !kpis) {
    return <LoadingSpinner fullScreen message="Carregando dashboard..." />;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
      case 'concluído':
        return 'success';
      case 'pausado':
        return 'warning';
      case 'cancelado':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Dados para os gráficos
  const monthlyRevenueData = [
    { label: 'Jan', value: 1000, color: '#3b82f6' },
    { label: 'Fev', value: 1500, color: '#3b82f6' },
    { label: 'Mar', value: 2000, color: '#3b82f6' },
    { label: 'Abr', value: 1800, color: '#3b82f6' },
    { label: 'Mai', value: 2200, color: '#3b82f6' },
    { label: 'Jun', value: 2500, color: '#3b82f6' },
  ];

  const weeklyProjectsData = [
    { label: 'Sem 1', value: 3, color: '#10b981' },
    { label: 'Sem 2', value: 5, color: '#10b981' },
    { label: 'Sem 3', value: 2, color: '#10b981' },
    { label: 'Sem 4', value: 7, color: '#10b981' },
  ];

  const pieData = projectStatusDistribution?.map((item, index) => ({
    label: item.status,
    value: item.count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
  })) || [
    { label: 'Ativo', value: 5, color: '#3b82f6' },
    { label: 'Pausado', value: 2, color: '#f59e0b' },
    { label: 'Concluído', value: 8, color: '#10b981' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral do seu negócio
          </Text>
        </View>

        {/* KPIs Grid */}
        {kpis && (
          <View className="px-6 mb-6">
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Card className="h-24">
                  <CardContent className="flex-row items-center justify-between p-4">
                    <View>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {kpis.totalClientes}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        Clientes
                      </Text>
                    </View>
                    <Ionicons name="people" size={24} color="#3b82f6" />
                  </CardContent>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card className="h-24">
                  <CardContent className="flex-row items-center justify-between p-4">
                    <View>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {kpis.totalProjects}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        Projetos
                      </Text>
                    </View>
                    <Ionicons name="briefcase" size={24} color="#10b981" />
                  </CardContent>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card className="h-24">
                  <CardContent className="flex-row items-center justify-between p-4">
                    <View>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {kpis.upcomingEvents}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        Eventos
                      </Text>
                    </View>
                    <Ionicons name="calendar" size={24} color="#f59e0b" />
                  </CardContent>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card className="h-24">
                  <CardContent className="flex-row items-center justify-between p-4">
                    <View>
                      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        R$ {kpis.saldoMesAtual?.toLocaleString('pt-BR') || '0'}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        Saldo Mensal
                      </Text>
                    </View>
                    <Ionicons name="cash" size={24} color="#ef4444" />
                  </CardContent>
                </Card>
              </View>
            </View>
          </View>
        )}

        {/* Revenue Chart */}
        <View className="px-6 mb-6">
          <CustomBarChart 
            data={monthlyRevenueData} 
            title="Receita Mensal (R$)" 
          />
        </View>

        {/* Project Status Distribution Chart */}
        <View className="px-6 mb-6">
          <CustomPieChart 
            data={pieData} 
            title="Distribuição de Status dos Projetos" 
          />
        </View>

        {/* Weekly Projects Chart */}
        <View className="px-6 mb-6">
          <CustomBarChart 
            data={weeklyProjectsData} 
            title="Projetos por Semana" 
          />
        </View>

        {/* Project Status Distribution List */}
        {projectStatusDistribution && projectStatusDistribution.length > 0 && (
          <View className="px-6 mb-6">
            <Card>
              <CardHeader>
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Detalhes dos Status
                </Text>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  {projectStatusDistribution.map((item, index) => (
                    <View key={index} className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Badge variant={getStatusColor(item.status)} size="sm">
                          {item.status}
                        </Badge>
                        <Text className="ml-3 text-gray-700 dark:text-gray-300">
                          {item.count} projeto{item.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {((item.count / ((kpis?.projetosAtivos || 0) + (kpis?.projetosConcluidos || 0)) || 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Recent Items */}
        {recentItems && (
          <View className="px-6 mb-6">
            <Card>
              <CardHeader>
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Atividades Recentes
                </Text>
              </CardHeader>
              <CardContent>
                <View className="space-y-4">
                  {recentItems.filter(item => item.type === 'client').slice(0, 3).map((client) => (
                    <View key={client.id} className="flex-row items-center">
                      <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-gray-100 font-medium">
                          {client.title}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                          Cliente adicionado
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  {recentItems.filter(item => item.type === 'project').slice(0, 3).map((project) => (
                    <View key={project.id} className="flex-row items-center">
                      <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-gray-100 font-medium">
                          {project.title}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                          Projeto criado
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  {recentItems.filter(item => item.type === 'event').slice(0, 2).map((event) => (
                    <View key={event.id} className="flex-row items-center">
                      <View className="w-2 h-2 bg-yellow-500 rounded-full mr-3" />
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-gray-100 font-medium">
                          {event.title}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                          Evento agendado
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View className="px-6 mb-6">
            <Card variant="outlined">
              <CardContent className="p-4">
                <Text className="text-red-600 dark:text-red-400 text-center">
                  Erro ao carregar dados: {error}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
