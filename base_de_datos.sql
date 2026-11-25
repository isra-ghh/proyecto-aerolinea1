BEGIN;

CREATE TABLE aviones (
    id SERIAL PRIMARY KEY,
    modelo VARCHAR(80) NOT NULL,
    matricula VARCHAR(15) NOT NULL UNIQUE,
    capacidad_total INTEGER NOT NULL CHECK (capacidad_total > 0)
);

CREATE TABLE pasajeros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    numero_pasaporte VARCHAR(20) NOT NULL UNIQUE,
    nacionalidad VARCHAR(60) NOT NULL
);

CREATE TABLE vuelos (
    id SERIAL PRIMARY KEY,
    origen VARCHAR(80) NOT NULL,
    destino VARCHAR(80) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    avion_id INTEGER NOT NULL REFERENCES aviones(id)
);

CREATE TABLE boletos_equipaje (
    id SERIAL PRIMARY KEY,
    numero_asiento VARCHAR(6) NOT NULL,
    kilos_equipaje NUMERIC(6, 2) NOT NULL CHECK (kilos_equipaje >= 0),
    pasajero_id INTEGER NOT NULL REFERENCES pasajeros(id),
    vuelo_id INTEGER NOT NULL REFERENCES vuelos(id),
    UNIQUE (vuelo_id, numero_asiento)
);

INSERT INTO aviones (modelo, matricula, capacidad_total) VALUES
('Airbus A320', 'XA-DE1', 180),
('Boeing 737-800', 'XA-DE2', 189),
('Embraer E190', 'XA-DE3', 100),
('Airbus A321', 'XA-DE4', 220),
('Boeing 737 MAX 8', 'XA-DE5', 178),
('Airbus A319', 'XA-DE6', 144),
('Embraer E195-E2', 'XA-DE7', 132),
('Airbus A220-300', 'XA-DE8', 145),
('Boeing 787-8', 'XA-DE9', 242),
('Airbus A330-300', 'XA-D10', 277);

INSERT INTO pasajeros (nombre, numero_pasaporte, nacionalidad) VALUES
('Ana Torres', 'DEMO0001', 'Mexicana'),
('Luis Mendoza', 'DEMO0002', 'Mexicana'),
('Sofia Rojas', 'DEMO0003', 'Colombiana'),
('Mateo Lopez', 'DEMO0004', 'Mexicana'),
('Camila Silva', 'DEMO0005', 'Chilena'),
('Diego Perez', 'DEMO0006', 'Mexicana'),
('Lucia Romero', 'DEMO0007', 'Argentina'),
('Daniel Cruz', 'DEMO0008', 'Mexicana'),
('Elena Martin', 'DEMO0009', 'Española'),
('Nicolas Vargas', 'DEMO0010', 'Peruana');

INSERT INTO vuelos (origen, destino, fecha_hora, avion_id) VALUES
('Querétaro', 'Monterrey', '2027-01-15 08:00:00', 1),
('Monterrey', 'Querétaro', '2027-01-15 12:00:00', 1),
('Guadalajara', 'Cancún', '2027-01-15 09:30:00', 2),
('Ciudad de México', 'Mérida', '2027-01-16 07:45:00', 3),
('Monterrey', 'Tijuana', '2027-01-16 10:00:00', 4),
('Mérida', 'Ciudad de México', '2027-01-17 14:30:00', 5),
('Puerto Vallarta', 'Guadalajara', '2027-01-17 16:15:00', 6),
('Tijuana', 'Ciudad de México', '2027-01-18 11:20:00', 7),
('Ciudad de México', 'Bogotá', '2027-01-19 19:00:00', 9),
('Ciudad de México', 'Madrid', '2027-01-20 21:30:00', 10);

INSERT INTO boletos_equipaje (numero_asiento, kilos_equipaje, pasajero_id, vuelo_id) VALUES
('12A', 18.50, 1, 1),
('12B', 0.00, 2, 1),
('07C', 14.00, 3, 3),
('18D', 22.00, 4, 4),
('05A', 12.50, 5, 5),
('09F', 19.00, 6, 6),
('14B', 15.00, 7, 7),
('11C', 10.50, 8, 8),
('21A', 23.00, 9, 9),
('25F', 20.00, 10, 10);

COMMIT;
