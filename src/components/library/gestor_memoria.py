"""
GESTOR DE MEMORIA MÍNIMO
Simulación de administración de memoria principal, paginación y espacio SWAP.
"""

PAGE_SIZE = 4  # Tamaño de cada página / marco en unidades
TOTAL_RAM_BLOCKS = 16  # Memoria RAM de 64 unidades (16 marcos)


class GestorMemoria:

    def __init__(self, num_marcos=TOTAL_RAM_BLOCKS):
        self.num_marcos = num_marcos
        self.ram = [None] * num_marcos  # Representación de marcos en RAM
        self.swap = {}  # Almacenamiento SWAP {id_proceso: [paginas]}
        self.procesos = {}  # {id_proceso: {"paginas": int, "en_ram": bool}}

    def mostrar_memoria(self):
        """1. Mostrar memoria RAM."""
        print("\n=== ESTADO DE LA MEMORIA RAM ===")
        for i in range(self.num_marcos):
            estado = (
                f"Proceso {self.ram[i]}"
                if self.ram[i] is not None
                else "LIBRE"
            )
            print(
                f"Marco [{i:02d}] (Dir {i*PAGE_SIZE:02d}-{(i+1)*PAGE_SIZE-1:02d}): {estado}"
            )

    def crear_proceso(self, id_proceso, tamano):
        """2. Crear proceso y asignarlo a memoria."""
        if id_proceso in self.procesos or id_proceso in self.swap:
            print(f"[-] Error: El proceso '{id_proceso}' ya existe.")
            return

        paginas_necesarias = (tamano + PAGE_SIZE - 1) // PAGE_SIZE
        marcos_libres = [
            i for i, marco in enumerate(self.ram) if marco is None
        ]

        if len(marcos_libres) >= paginas_necesarias:
            for i in range(paginas_necesarias):
                self.ram[marcos_libres[i]] = id_proceso
            self.procesos[id_proceso] = {
                "paginas": paginas_necesarias,
                "en_ram": True,
            }
            print(
                f"[+] Proceso '{id_proceso}' creado con éxito ({paginas_necesarias} página(s) asignada(s))."
            )
        else:
            print(
                f"[-] RAM insuficiente. Se requieren {paginas_necesarias} marcos y hay {len(marcos_libres)} libres."
            )

    def terminar_proceso(self, id_proceso):
        """3. Terminar proceso y liberar espacio."""
        if id_proceso in self.procesos:
            for i in range(self.num_marcos):
                if self.ram[i] == id_proceso:
                    self.ram[i] = None
            del self.procesos[id_proceso]
            print(f"[+] Proceso '{id_proceso}' terminado y liberado de RAM.")
        elif id_proceso in self.swap:
            del self.swap[id_proceso]
            print(f"[+] Proceso '{id_proceso}' eliminado del área de SWAP.")
        else:
            print(f"[-] Error: El proceso '{id_proceso}' no existe.")

    def compactar_memoria(self):
        """4. Compactar memoria (desplazar huecos libres)."""
        ocupados = [m for m in self.ram if m is not None]
        libres = [None] * (self.num_marcos - len(ocupados))
        self.ram = ocupados + libres
        print(
            "[+] Memoria compactada. Todos los espacios libres han sido consolidados al final."
        )

    def mostrar_paginas(self):
        """5. Mostrar la tabla de páginas por proceso."""
        print("\n=== TABLA DE PÁGINAS ===")
        if not self.procesos and not self.swap:
            print("No hay procesos activos.")
            return

        for id_p, info in self.procesos.items():
            marcos = [i for i, m in enumerate(self.ram) if m == id_p]
            print(
                f"Proceso '{id_p}' (RAM): {info['paginas']} Pág(s) -> Marcos: {marcos}"
            )

        for id_p, paginas in self.swap.items():
            print(f"Proceso '{id_p}' (SWAP): {paginas} Pág(s) en disco.")

    def enviar_a_swap(self, id_proceso):
        """6. Enviar proceso de RAM a SWAP."""
        if id_proceso in self.procesos and self.procesos[id_proceso]["en_ram"]:
            paginas = self.procesos[id_proceso]["paginas"]
            for i in range(self.num_marcos):
                if self.ram[i] == id_proceso:
                    self.ram[i] = None
            del self.procesos[id_proceso]
            self.swap[id_proceso] = paginas
            print(f"[+] Proceso '{id_proceso}' trasladado al área de SWAP.")
        else:
            print(f"[-] Error: El proceso '{id_proceso}' no está en RAM.")

    def recuperar_de_swap(self, id_proceso):
        """7. Recuperar proceso desde SWAP a RAM."""
        if id_proceso not in self.swap:
            print(f"[-] Error: El proceso '{id_proceso}' no está en SWAP.")
            return

        paginas_necesarias = self.swap[id_proceso]
        marcos_libres = [
            i for i, marco in enumerate(self.ram) if marco is None
        ]

        if len(marcos_libres) >= paginas_necesarias:
            for i in range(paginas_necesarias):
                self.ram[marcos_libres[i]] = id_proceso
            self.procesos[id_proceso] = {
                "paginas": paginas_necesarias,
                "en_ram": True,
            }
            del self.swap[id_proceso]
            print(
                f"[+] Proceso '{id_proceso}' restaurado de SWAP a RAM con éxito."
            )
        else:
            print(
                f"[-] No hay suficiente espacio en RAM ({len(marcos_libres)} libres, se requieren {paginas_necesarias})."
            )


def menu():
    gestor = GestorMemoria()
    while True:
        print("\n" + "=" * 30)
        print("      GESTOR DE MEMORIA")
        print("=" * 30)
        print("1. Mostrar memoria")
        print("2. Crear proceso")
        print("3. Terminar proceso")
        print("4. Compactar memoria")
        print("5. Mostrar páginas")
        print("6. Enviar proceso a SWAP")
        print("7. Recuperar proceso de SWAP")
        print("8. Salir")

        opcion = input("Seleccione una opción (1-8): ").strip()

        if opcion == "1":
            gestor.mostrar_memoria()
        elif opcion == "2":
            pid = input("Identificador del proceso: ").strip()
            try:
                tam = int(input("Tamaño del proceso (unidades): "))
                gestor.crear_proceso(pid, tam)
            except ValueError:
                print("[-] Ingrese un tamaño numérico válido.")
        elif opcion == "3":
            pid = input("Identificador del proceso a terminar: ").strip()
            gestor.terminar_proceso(pid)
        elif opcion == "4":
            gestor.compactar_memoria()
        elif opcion == "5":
            gestor.mostrar_paginas()
        elif opcion == "6":
            pid = input("Identificador del proceso a SWAP: ").strip()
            gestor.enviar_a_swap(pid)
        elif opcion == "7":
            pid = input("Identificador del proceso desde SWAP: ").strip()
            gestor.recuperar_de_swap(pid)
        elif opcion == "8":
            print("Saliendo del Gestor de Memoria...")
            break
        else:
            print("Opción inválida. Intente de nuevo.")


if __name__ == "__main__":
    menu()