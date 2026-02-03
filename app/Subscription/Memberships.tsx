import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/common/store";
import { fetchMemberships, renewMembership, createMembership, cancelMembership, selectMembershipLoading } from "@/common/reducers/membershipSlice";
import { differenceInDays } from "date-fns";

const SubscriptionCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const memberships = useSelector((state: RootState) => state.memberships.memberships);
  const isLoading = useSelector(selectMembershipLoading);

  // Filtrar membresía activa
  const activeMembership = memberships.find((membership) => membership.status === "ACTIVA");

  useEffect(() => {
    if (user?.uid) {
      // Cargar membresías al montar el componente si el usuario está autenticado
      dispatch(fetchMemberships(user.uid));
    }
  }, [dispatch, user?.uid]);

  const handleRenew = (uid: string) => {
    dispatch(renewMembership(uid))
      .then(() => {
        alert("Membresía renovada con éxito");
      })
      .catch(() => {
        alert("Error al renovar la membresía");
      });
  };

  const handleCancel = (uid: string) => {
    dispatch(cancelMembership(uid))
      .then(() => {
        alert("Membresía cancelada con éxito");
      })
      .catch(() => {
        alert("Error al cancelar la membresía");
      });
  };

  const handleCreateMembership = (plan: string) => {
    dispatch(createMembership(user.uid))
      .then(() => {
        alert(`Membresía de ${plan} creada con éxito`);
      })
      .catch(() => {
        alert("Error al crear la membresía");
      });
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F20505" />
      </View>
    );
  }

  // Calcular días restantes
  const daysLeft = activeMembership ? differenceInDays(new Date(activeMembership.fecha_terminada), new Date()) : 0;

  return (
    <View style={styles.container}>
      {/* Si no tiene membresía activa, mostrar opción para crear */}
      {!activeMembership ? (
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.planTitle}>No tienes una membresía activa</Text>
            <Text style={styles.planDescription}>
              Puedes adquirir una de nuestras membresías para comenzar a disfrutar de sus beneficios.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleCreateMembership('Scale')}
          >
            <Text style={styles.subscribeButtonText}>Crear Membresía Scale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleCreateMembership('Growth')}
          >
            <Text style={styles.subscribeButtonText}>Crear Membresía Growth</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleCreateMembership('Personal')}
          >
            <Text style={styles.subscribeButtonText}>Crear Membresía Personal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Si tiene membresía activa, mostrar detalles */
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.planTitle}>Membresía Activa</Text>
            <Text style={styles.planDescription}>
              {activeMembership.status === "ACTIVA"
                ? "¡Felicidades! Tu membresía está activa. ¡Disfruta de todos los beneficios exclusivos!"
                : null}
            </Text>
          </View>

          <View style={styles.planDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{activeMembership.status}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Monto</Text>
              <Text style={styles.detailValue}>{activeMembership.costo}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Inicio</Text>
              <Text style={styles.detailValue}>{activeMembership.fecha_inicio}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Vence</Text>
              <Text style={styles.detailValue}>{activeMembership.fecha_terminada}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Días Restantes</Text>
              <Text style={styles.detailValue}>{daysLeft}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.renewButton} onPress={() => handleRenew(activeMembership.uid)}>
            <Text style={styles.renewButtonText}>Renovar Membresía</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.renewButton, { backgroundColor: "#ff3333" }]} onPress={() => handleCancel(activeMembership.uid)}>
            <Text style={styles.renewButtonText}>Cancelar Membresía</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de membresías históricas (todas, sin importar el estado) */}
      {memberships.length > 0 ? (
        <FlatList
          data={memberships}
          keyExtractor={(item) => item.uid.toString()}
          renderItem={({ item }) => (
            <View style={styles.transactionCard}>
              <Text style={styles.transactionTitle}>Membresía {item.status}</Text>
              <Text style={styles.transactionInfo}>Monto: {item.costo}</Text>
              <Text style={styles.transactionInfo}>Inicia el: {item.fecha_inicio}</Text>
              <Text style={styles.transactionInfo}>Vence el: {item.fecha_terminada}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.noMembershipContainer}>
          <Text>No tienes membresías registradas</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
    color: "#666",
  },
  planDetails: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  renewButton: {
    backgroundColor: "#333",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  renewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  subscribeButton: {
    backgroundColor: "#F20505",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  transactionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  transactionInfo: {
    fontSize: 14,
    color: "#000",
    marginBottom: 8,
    fontWeight: "bold",
  },
  noMembershipContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SubscriptionCard;