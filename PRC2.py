import random
import time
import threading

# Clase que representa un proceso
class Proceso:
    def _init_(self, id, tiempo_maximo, operacion, operando1, operando2):
        self.id = id
        self.tiempo_maximo = tiempo_maximo
        self.tiempo_restante = tiempo_maximo
        self.operacion = operacion
        self.operando1 = operando1
        self.operando2 = operando2
        self.estado = 'En espera'

    def ejecutar(self):
        print(f"\nProceso en ejecución: ID {self.id}, Operación: {self.operando1} {self.operacion} {self.operando2}")
        tiempo_transcurrido = 0
        
        while self.tiempo_restante > 0:
            print(f"Tiempo transcurrido: {tiempo_transcurrido} | Tiempo restante: {self.tiempo_restante}", end="\r")
            time.sleep(1)
            tiempo_transcurrido += 1
            self.tiempo_restante -= 1
            
            if self.estado in ['Interrumpido', 'Error']:
                print(f"\nProceso {self.id} ha sido {self.estado.lower()}.")
                return
            
            if self.estado == 'Pausado':
                print(f"\nProceso {self.id} en pausa. Presiona 'C' para continuar...")
                while self.estado == 'Pausado':
                    time.sleep(0.1)

        self.estado = 'Terminado'
        print(f"\nProceso {self.id} terminado correctamente.")
        self.mostrar_resultado()

    def mostrar_resultado(self):
        resultado = 0
        if self.operacion == '+':
            resultado = self.operando1 + self.operando2
        elif self.operacion == '-':
            resultado = self.operando1 - self.operando2
        elif self.operacion == '*':
            resultado = self.operando1 * self.operando2
        elif self.operacion == '/':
            resultado = self.operando1 / self.operando2 if self.operando2 != 0 else "Error (división por cero)"
        elif self.operacion == '%':
            resultado = self.operando1 % self.operando2 if self.operando2 != 0 else "Error (módulo por cero)"
        print(f"Resultado de la operación {self.operando1} {self.operacion} {self.operando2} = {resultado}")

class Lote:
    def _init_(self):
        self.procesos = []

class ColaLotes:
    def _init_(self):
        self.lotes = []
        self.procesos_terminados = []

    def agregar_lote(self, lote):
        self.lotes.append(lote)

    def ejecutar_lotes(self):
        while self.lotes:
            lote_actual = self.lotes.pop(0)
            print(f"\nEjecutando lote con {len(lote_actual.procesos)} procesos.")
            for proceso in lote_actual.procesos:
                proceso.ejecutar()
                if proceso.estado == 'Terminado':
                    self.procesos_terminados.append(proceso)
            print(f"Lotes pendientes: {len(self.lotes)}")

    def mostrar_resultados(self):
        print("\nResultados de todos los procesos:")
        for proceso in self.procesos_terminados:
            print(f"Proceso ID: {proceso.id}")

# Función para generar procesos con datos aleatorios
def crear_proceso(id):
    tiempo_maximo = random.randint(7, 18)
    operacion = random.choice(['+', '-', '*', '/', '%'])
    operando1 = random.randint(1, 100)
    operando2 = random.randint(1, 100)
    if operacion in ['/', '%'] and operando2 == 0:
        operando2 = 1
    return Proceso(id, tiempo_maximo, operacion, operando1, operando2)

# Función para generar un lote de procesos
def crear_lote(id_inicial, cantidad_procesos):
    lote = Lote()
    for _ in range(min(3, cantidad_procesos)):
        proceso = crear_proceso(id_inicial)
        lote.procesos.append(proceso)
        id_inicial += 1
    return lote

# Función para manejar la entrada del usuario
def manejar_entrada(proceso):
    while proceso.estado != 'Terminado':
        comando = input("Ingrese 'i' para interrumpir, 'e' para error, 'p' para pausar, 'c' para continuar: ").strip().lower()
        if comando == 'i':
            print(f"\nInterrumpiendo Proceso {proceso.id}...")
            proceso.estado = 'Interrumpido'
            return
        elif comando == 'e':
            print(f"\nError en Proceso {proceso.id}...")
            proceso.estado = 'Error'
            return
        elif comando == 'p':
            print(f"\nPausando Proceso {proceso.id}...")
            proceso.estado = 'Pausado'
        elif comando == 'c' and proceso.estado == 'Pausado':
            print(f"\nReanudando Proceso {proceso.id}...")
            proceso.estado = 'En ejecución'

# Función principal
def main():
    random.seed(time.time())
    cola_lotes = ColaLotes()
    cantidad_procesos = int(input("Ingrese el número de procesos: "))
    id_inicial = 1

    while cantidad_procesos > 0:
        lote = crear_lote(id_inicial, cantidad_procesos)
        cola_lotes.agregar_lote(lote)
        cantidad_procesos -= len(lote.procesos)
        id_inicial += len(lote.procesos)

    for lote in cola_lotes.lotes:
        print(f"\nEjecutando lote con {len(lote.procesos)} procesos.")
        for proceso in lote.procesos:
            hilo_entrada = threading.Thread(target=manejar_entrada, args=(proceso,))
            hilo_entrada.daemon = True
            hilo_entrada.start()
            proceso.ejecutar()
    
    cola_lotes.mostrar_resultados()

if __name__ == "_main_":
    main()