/* ============================================================
   iGotUp · Máscaras e formatação de entrada
   Utilitário reutilizável para os formulários do hub e módulos.
   Expor global: window.iGotUpMasks
   ============================================================ */
(function (global) {
  'use strict';

  function onlyDigits(s) {
    return String(s == null ? '' : s).replace(/\D/g, '');
  }

  // --- WhatsApp / telefone: (DDD) 9XXXX-XXXX  |  (DDD) XXXX-XXXX ---
  function maskWhats(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length === 0) return '';
    const ddd = d.slice(0, 2);
    const resto = d.slice(2);
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + ddd + ') ' + resto; // ainda sem hífen (parte central incompleta)
    if (d.length <= 10) {
      // 8 dígitos fixos (ou 9 incompletos): separa hífen nos últimos 4
      if (resto.length <= 4) return '(' + ddd + ') ' + resto;
      return '(' + ddd + ') ' + resto.slice(0, resto.length - 4) + '-' + resto.slice(resto.length - 4);
    }
    // 11 dígitos (com 9º dígito): (DDD) 9XXXX-XXXX
    return '(' + ddd + ') ' + resto.slice(0, 5) + '-' + resto.slice(5);
  }

  // --- CPF: 000.000.000-00 ---
  function maskCpf(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
    return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
  }

  // --- Cidade: apenas texto (remove dígitos, limpa espaços) ---
  function maskCidade(value) {
    return String(value == null ? '' : value).replace(/[0-9]/g, '').replace(/\s+/g, ' ').trim();
  }

  // --- Validação do CPF (dígitos verificadores) ---
  function validaCpf(cpf) {
    const d = onlyDigits(cpf);
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false; // todos iguais
    const calc = (len) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += parseInt(d.charAt(i)) * (len + 1 - i);
      const r = (sum * 10) % 11;
      return (r === 10) ? 0 : r;
    };
    if (calc(9) !== parseInt(d.charAt(9))) return false;
    if (calc(10) !== parseInt(d.charAt(10))) return false;
    return true;
  }

  global.iGotUpMasks = {
    onlyDigits,
    maskWhats,
    maskCpf,
    maskCidade,
    validaCpf,
  };
})(window);
