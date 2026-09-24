import os
D = os.path.dirname(os.path.abspath(__file__)) + "/"
s = open(D + "Codigo_v7.gs", encoding="utf-8").read()
a = 'puede: { gestion: _permitido_(SESION, P_GESTION), correo: _permitido_(SESION, P_CORREO), admin: _permitido_(SESION, P_ADMIN) } } : null,'
assert a in s
s = s.replace(a, 'puede: { radicar: _permitido_(SESION, P_RADICAR), gestion: _permitido_(SESION, P_GESTION), correo: _permitido_(SESION, P_CORREO), admin: _permitido_(SESION, P_ADMIN) } } : null,', 1)
open(D + "Codigo_v7.gs", "w", encoding="utf-8").write(s)
print("ok73")
