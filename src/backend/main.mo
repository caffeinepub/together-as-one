import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type User = {
    id : Text; name : Text; email : Text; passwordHash : Text;
    role : Text; savings : Nat; lastLogin : Int;
  };
  type Transaction = { id : Text; userId : Text; amount : Nat; timestamp : Int };
  type LoanStatus = { #pending; #approved; #rejected; #paid };
  type Loan = { id : Text; userId : Text; amount : Nat; interest : Nat; status : LoanStatus; timestamp : Int };
  type DepositStatus = { #pending; #approved; #rejected };
  type DepositRequest = { id : Text; userId : Text; amount : Nat; status : DepositStatus; timestamp : Int };
  type WithdrawalStatus = { #pending; #approved; #rejected };
  type WithdrawalRequest = { id : Text; userId : Text; amount : Nat; status : WithdrawalStatus; timestamp : Int; note : Text };
  type LoanPayment = { id : Text; loanId : Text; userId : Text; amount : Nat; timestamp : Int };
  type MonthlyContribution = { id : Text; userId : Text; month : Nat; year : Nat; amount : Nat; timestamp : Int };
  type MemberSummary = { id : Text; name : Text; email : Text; savings : Nat; loanCount : Nat };
  type MemberDetail = { user : User; transactions : [Transaction]; loans : [Loan] };
  type UserProfile = { id : Text; name : Text; email : Text; role : Text; savings : Nat; lastLogin : Int };
  type BroadcastNotification = { id : Text; title : Text; body : Text; timestamp : Int };

  stable var stableUsers : [(Text, User)] = [];
  stable var stableEmailToUserId : [(Text, Text)] = [];
  stable var stablePrincipalToUserId : [(Principal, Text)] = [];
  stable var stableTransactions : [(Text, Transaction)] = [];
  stable var stableLoans : [(Text, Loan)] = [];
  stable var stableDepositRequests : [(Text, DepositRequest)] = [];
  stable var stableWithdrawalRequests : [(Text, WithdrawalRequest)] = [];
  stable var stableLoanPayments : [(Text, LoanPayment)] = [];
  stable var stableMonthlyContributions : [(Text, MonthlyContribution)] = [];
  stable var stableBroadcastNotifications : [(Text, BroadcastNotification)] = [];
  stable var adminInitialized : Bool = false;
  stable var adminId : Text = "";
  stable var adminUser : User = { id = ""; name = ""; email = ""; passwordHash = ""; role = ""; savings = 0; lastLogin = 0 };
  stable var monthlyContributionTarget : Nat = 1000;

  let users = Map.empty<Text, User>();
  let emailToUserId = Map.empty<Text, Text>();
  let principalToUserId = Map.empty<Principal, Text>();
  let transactions = Map.empty<Text, Transaction>();
  let loans = Map.empty<Text, Loan>();
  let depositRequests = Map.empty<Text, DepositRequest>();
  let withdrawalRequests = Map.empty<Text, WithdrawalRequest>();
  let loanPayments = Map.empty<Text, LoanPayment>();
  let monthlyContributions = Map.empty<Text, MonthlyContribution>();
  let broadcastNotifications = Map.empty<Text, BroadcastNotification>();

  stable var nextUserId : Nat = 1;
  stable var nextTransactionId : Nat = 1;
  stable var nextLoanId : Nat = 1;
  stable var nextDepositRequestId : Nat = 1;
  stable var nextWithdrawalRequestId : Nat = 1;
  stable var nextLoanPaymentId : Nat = 1;
  stable var nextContributionId : Nat = 1;
  stable var nextBroadcastId : Nat = 1;

  let ADMIN_EMAIL = "admin@gmail.com";
  let ADMIN_PASSWORD = "admin123";
  let ADMIN_FIXED_ID = "admin-0";

  func hashPassword(p : Text) : Text { "hash_" # p };
  func generateUserId() : Text { let id = nextUserId.toText(); nextUserId += 1; id };
  func generateTransactionId() : Text { let id = nextTransactionId.toText(); nextTransactionId += 1; id };
  func generateLoanId() : Text { let id = nextLoanId.toText(); nextLoanId += 1; id };
  func generateDepositRequestId() : Text { let id = nextDepositRequestId.toText(); nextDepositRequestId += 1; "dr" # id };
  func generateWithdrawalRequestId() : Text { let id = nextWithdrawalRequestId.toText(); nextWithdrawalRequestId += 1; "wr" # id };
  func generateLoanPaymentId() : Text { let id = nextLoanPaymentId.toText(); nextLoanPaymentId += 1; "lp" # id };
  func generateContributionId() : Text { let id = nextContributionId.toText(); nextContributionId += 1; "mc" # id };
  func generateBroadcastId() : Text { let id = nextBroadcastId.toText(); nextBroadcastId += 1; "bn" # id };

  // Always scan all users by email — never rely solely on the index.
  // This ensures login works even if the index is stale or corrupted.
  func getUserByEmail(email : Text) : ?User {
    var found : ?User = null;
    for (u in users.values()) {
      if (u.email == email) { found := ?u };
    };
    // Repair the index while we're here
    switch (found) {
      case (?u) { emailToUserId.remove(email); emailToUserId.add(email, u.id) };
      case null {};
    };
    found
  };

  func getUserById(uid : Text) : ?User { users.get(uid) };
  func isAdminById(uid : Text) : Bool {
    if (uid == ADMIN_FIXED_ID) return true;
    switch (users.get(uid)) { case null false; case (?u) u.role == "admin" };
  };
  func getCallerUserId(caller : Principal) : ?Text { principalToUserId.get(caller) };
  func isAdminCaller(caller : Principal) : Bool {
    switch (principalToUserId.get(caller)) {
      case null false;
      case (?uid) { if (uid == ADMIN_FIXED_ID) return true; switch (users.get(uid)) { case null false; case (?u) u.role == "admin" } };
    };
  };
  func isLoggedIn(caller : Principal) : Bool {
    switch (principalToUserId.get(caller)) { case null false; case (?_) true };
  };

  func getLoanPaidAmount(loanId : Text) : Nat {
    var total : Nat = 0;
    for (p in loanPayments.values()) {
      if (p.loanId == loanId) { total += p.amount };
    };
    total;
  };

  func ensureAdminExists() {
    let existingSavings : Nat = switch (users.get(ADMIN_FIXED_ID)) {
      case (?u) u.savings; case null 0;
    };
    users.remove(ADMIN_FIXED_ID);
    emailToUserId.remove("petermuchere@gmail.com");
    emailToUserId.remove(ADMIN_EMAIL);
    let a : User = {
      id = ADMIN_FIXED_ID; name = "Admin"; email = ADMIN_EMAIL;
      passwordHash = hashPassword(ADMIN_PASSWORD); role = "admin";
      savings = existingSavings; lastLogin = 0;
    };
    users.add(ADMIN_FIXED_ID, a);
    emailToUserId.add(ADMIN_EMAIL, ADMIN_FIXED_ID);
  };

  system func preupgrade() {
    stableUsers := users.entries().toArray();
    stableEmailToUserId := emailToUserId.entries().toArray();
    stablePrincipalToUserId := principalToUserId.entries().toArray();
    stableTransactions := transactions.entries().toArray();
    stableLoans := loans.entries().toArray();
    stableDepositRequests := depositRequests.entries().toArray();
    stableWithdrawalRequests := withdrawalRequests.entries().toArray();
    stableLoanPayments := loanPayments.entries().toArray();
    stableMonthlyContributions := monthlyContributions.entries().toArray();
    stableBroadcastNotifications := broadcastNotifications.entries().toArray();
  };

  system func postupgrade() {
    for ((k, v) in stableUsers.vals()) { users.remove(k); users.add(k, v) };
    for ((k, v) in stableEmailToUserId.vals()) { emailToUserId.remove(k); emailToUserId.add(k, v) };
    for ((k, v) in stablePrincipalToUserId.vals()) { principalToUserId.remove(k); principalToUserId.add(k, v) };
    for ((k, v) in stableTransactions.vals()) { transactions.remove(k); transactions.add(k, v) };
    for ((k, v) in stableLoans.vals()) { loans.remove(k); loans.add(k, v) };
    for ((k, v) in stableDepositRequests.vals()) { depositRequests.remove(k); depositRequests.add(k, v) };
    for ((k, v) in stableWithdrawalRequests.vals()) { withdrawalRequests.remove(k); withdrawalRequests.add(k, v) };
    for ((k, v) in stableLoanPayments.vals()) { loanPayments.remove(k); loanPayments.add(k, v) };
    for ((k, v) in stableMonthlyContributions.vals()) { monthlyContributions.remove(k); monthlyContributions.add(k, v) };
    for ((k, v) in stableBroadcastNotifications.vals()) { broadcastNotifications.remove(k); broadcastNotifications.add(k, v) };
    ensureAdminExists();
  };

  ensureAdminExists();

  // ── Broadcast Notifications ──────────────────────────────────────────────
  public shared func sendBroadcastNotification(adminUserId : Text, title : Text, body : Text) : async { #ok : BroadcastNotification; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    let bid = generateBroadcastId();
    let bn : BroadcastNotification = { id = bid; title = title; body = body; timestamp = Time.now() };
    broadcastNotifications.add(bid, bn);
    #ok(bn);
  };

  public query func getBroadcastNotifications() : async [BroadcastNotification] {
    broadcastNotifications.values().toArray();
  };
  // ────────────────────────────────────────────────────────────────────────

  public shared func register(name : Text, email : Text, password : Text) : async { #ok : User; #err : Text } {
    let trimmedEmail = email; // email should be pre-trimmed by frontend
    if (trimmedEmail == ADMIN_EMAIL) return #err("This email is reserved");
    switch (getUserByEmail(trimmedEmail)) {
      case (?_) return #err("Email already registered");
      case null {};
    };
    let uid = generateUserId();
    let u : User = { id = uid; name = name; email = trimmedEmail; passwordHash = hashPassword(password); role = "member"; savings = 0; lastLogin = Time.now() };
    users.add(uid, u);
    emailToUserId.add(trimmedEmail, uid);
    #ok(u);
  };

  public shared ({ caller }) func login(email : Text, password : Text) : async { #ok : User; #err : Text } {
    let trimmedEmail = email;
    if (trimmedEmail == ADMIN_EMAIL) {
      if (password != ADMIN_PASSWORD) return #err("Invalid password");
      let existingSavings : Nat = switch (users.get(ADMIN_FIXED_ID)) { case (?u) u.savings; case null 0 };
      let now = Time.now();
      let admin : User = {
        id = ADMIN_FIXED_ID; name = "Admin"; email = ADMIN_EMAIL;
        passwordHash = hashPassword(ADMIN_PASSWORD); role = "admin";
        savings = existingSavings; lastLogin = now;
      };
      users.remove(ADMIN_FIXED_ID); users.add(ADMIN_FIXED_ID, admin);
      emailToUserId.remove("petermuchere@gmail.com");
      emailToUserId.remove(ADMIN_EMAIL); emailToUserId.add(ADMIN_EMAIL, ADMIN_FIXED_ID);
      principalToUserId.remove(caller); principalToUserId.add(caller, ADMIN_FIXED_ID);
      return #ok(admin);
    };
    // Always scan all users for the email — never rely solely on index
    var foundUser : ?User = null;
    for (u in users.values()) {
      if (u.email == trimmedEmail) { foundUser := ?u };
    };
    switch (foundUser) {
      case null return #err("User not found. Please register first or check your email address.");
      case (?user) {
        if (user.passwordHash != hashPassword(password)) return #err("Invalid password");
        let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = user.passwordHash; role = user.role; savings = user.savings; lastLogin = Time.now() };
        users.remove(user.id); users.add(user.id, updated);
        // Repair the email index
        emailToUserId.remove(user.email); emailToUserId.add(user.email, user.id);
        principalToUserId.remove(caller); principalToUserId.add(caller, user.id);
        #ok(updated);
      };
    };
  };

  public query func getMyProfile(callerId : Text) : async { #ok : User; #err : Text } {
    switch (getUserById(callerId)) { case null #err("User not found"); case (?u) #ok(u) };
  };

  public shared func adminDeposit(adminUserId : Text, memberId : Text, amount : Nat) : async { #ok : Nat; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserById(memberId)) {
      case null return #err("Member not found");
      case (?user) {
        if (user.role == "admin") return #err("Cannot deposit to admin account");
        let newSavings = user.savings + amount;
        let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = user.passwordHash; role = user.role; savings = newSavings; lastLogin = user.lastLogin };
        users.remove(memberId); users.add(memberId, updated);
        let txId = generateTransactionId();
        transactions.add(txId, { id = txId; userId = memberId; amount = amount; timestamp = Time.now() });
        #ok(newSavings);
      };
    };
  };

  public shared func deposit(adminUserId : Text, userId : Text, amount : Nat) : async { #ok : Nat; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        let newSavings = user.savings + amount;
        let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = user.passwordHash; role = user.role; savings = newSavings; lastLogin = user.lastLogin };
        users.remove(userId); users.add(userId, updated);
        let txId = generateTransactionId();
        transactions.add(txId, { id = txId; userId = userId; amount = amount; timestamp = Time.now() });
        #ok(newSavings);
      };
    };
  };

  public shared func requestDeposit(userId : Text, amount : Nat) : async { #ok : DepositRequest; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        if (user.role == "admin") return #err("Admins cannot submit deposit requests");
        let drId = generateDepositRequestId();
        let dr : DepositRequest = { id = drId; userId = userId; amount = amount; status = #pending; timestamp = Time.now() };
        depositRequests.add(drId, dr);
        #ok(dr);
      };
    };
  };

  public shared func approveDeposit(adminUserId : Text, depositId : Text) : async { #ok : DepositRequest; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (depositRequests.get(depositId)) {
      case null return #err("Deposit request not found");
      case (?dr) {
        switch (getUserById(dr.userId)) {
          case null return #err("User not found");
          case (?user) {
            let newSavings = user.savings + dr.amount;
            let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = user.passwordHash; role = user.role; savings = newSavings; lastLogin = user.lastLogin };
            users.remove(user.id); users.add(user.id, updated);
            let txId = generateTransactionId();
            transactions.add(txId, { id = txId; userId = user.id; amount = dr.amount; timestamp = Time.now() });
            let updatedDr : DepositRequest = { id = dr.id; userId = dr.userId; amount = dr.amount; status = #approved; timestamp = dr.timestamp };
            depositRequests.remove(depositId); depositRequests.add(depositId, updatedDr);
            #ok(updatedDr);
          };
        };
      };
    };
  };

  public shared func rejectDeposit(adminUserId : Text, depositId : Text) : async { #ok : DepositRequest; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (depositRequests.get(depositId)) {
      case null return #err("Deposit request not found");
      case (?dr) {
        let updatedDr : DepositRequest = { id = dr.id; userId = dr.userId; amount = dr.amount; status = #rejected; timestamp = dr.timestamp };
        depositRequests.remove(depositId); depositRequests.add(depositId, updatedDr);
        #ok(updatedDr);
      };
    };
  };

  public query func getAllPendingDeposits(adminUserId : Text) : async { #ok : [DepositRequest]; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    #ok(depositRequests.values().filter(func(dr) { switch (dr.status) { case (#pending) true; case (_) false } }).toArray());
  };

  public query func getMyDepositRequests(userId : Text) : async { #ok : [DepositRequest]; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) #ok(depositRequests.values().filter(func(dr) { dr.userId == userId }).toArray());
    };
  };

  public query func getMyTransactions(userId : Text) : async { #ok : [Transaction]; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) #ok(transactions.values().filter(func(tx) { tx.userId == userId }).toArray());
    };
  };

  public shared func requestLoan(userId : Text, amount : Nat) : async { #ok : Loan; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        if (user.role == "admin") return #err("Admins cannot request loans");
        let loanId = generateLoanId();
        let loan : Loan = { id = loanId; userId = userId; amount = amount; interest = (amount * 10) / 100; status = #pending; timestamp = Time.now() };
        loans.add(loanId, loan);
        #ok(loan);
      };
    };
  };

  public query func getMyLoans(userId : Text) : async { #ok : [Loan]; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) #ok(loans.values().filter(func(l) { l.userId == userId }).toArray());
    };
  };

  public shared func makeRepayment(userId : Text, loanId : Text, amount : Nat) : async { #ok : LoanPayment; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) {
        switch (loans.get(loanId)) {
          case null return #err("Loan not found");
          case (?loan) {
            if (loan.userId != userId) return #err("Unauthorized");
            switch (loan.status) {
              case (#approved) {};
              case (_) return #err("Loan is not in approved status");
            };
            let totalOwed = loan.amount + loan.interest;
            let alreadyPaid = getLoanPaidAmount(loanId);
            if (alreadyPaid >= totalOwed) return #err("Loan already fully paid");
            let remaining = totalOwed - alreadyPaid;
            let actualAmount = if (amount > remaining) remaining else amount;
            let pid = generateLoanPaymentId();
            let payment : LoanPayment = { id = pid; loanId = loanId; userId = userId; amount = actualAmount; timestamp = Time.now() };
            loanPayments.add(pid, payment);
            if (alreadyPaid + actualAmount >= totalOwed) {
              let updated : Loan = { id = loan.id; userId = loan.userId; amount = loan.amount; interest = loan.interest; status = #paid; timestamp = loan.timestamp };
              loans.remove(loanId); loans.add(loanId, updated);
            };
            #ok(payment);
          };
        };
      };
    };
  };

  public query func getLoanPayments(loanId : Text) : async { #ok : [LoanPayment]; #err : Text } {
    #ok(loanPayments.values().filter(func(p) { p.loanId == loanId }).toArray());
  };

  public query func getMyLoanPayments(userId : Text) : async { #ok : [LoanPayment]; #err : Text } {
    #ok(loanPayments.values().filter(func(p) { p.userId == userId }).toArray());
  };

  public shared func requestWithdrawal(userId : Text, amount : Nat, note : Text) : async { #ok : WithdrawalRequest; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        if (user.role == "admin") return #err("Admins cannot request withdrawals");
        if (amount > user.savings) return #err("Insufficient savings balance");
        let wrId = generateWithdrawalRequestId();
        let wr : WithdrawalRequest = { id = wrId; userId = userId; amount = amount; status = #pending; timestamp = Time.now(); note = note };
        withdrawalRequests.add(wrId, wr);
        #ok(wr);
      };
    };
  };

  public shared func approveWithdrawal(adminUserId : Text, withdrawalId : Text) : async { #ok : WithdrawalRequest; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (withdrawalRequests.get(withdrawalId)) {
      case null return #err("Withdrawal request not found");
      case (?wr) {
        switch (getUserById(wr.userId)) {
          case null return #err("User not found");
          case (?user) {
            if (wr.amount > user.savings) return #err("Insufficient savings");
            let newSavings = user.savings - wr.amount;
            let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = user.passwordHash; role = user.role; savings = newSavings; lastLogin = user.lastLogin };
            users.remove(user.id); users.add(user.id, updated);
            let updatedWr : WithdrawalRequest = { id = wr.id; userId = wr.userId; amount = wr.amount; status = #approved; timestamp = wr.timestamp; note = wr.note };
            withdrawalRequests.remove(withdrawalId); withdrawalRequests.add(withdrawalId, updatedWr);
            #ok(updatedWr);
          };
        };
      };
    };
  };

  public shared func rejectWithdrawal(adminUserId : Text, withdrawalId : Text) : async { #ok : WithdrawalRequest; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (withdrawalRequests.get(withdrawalId)) {
      case null return #err("Withdrawal request not found");
      case (?wr) {
        let updatedWr : WithdrawalRequest = { id = wr.id; userId = wr.userId; amount = wr.amount; status = #rejected; timestamp = wr.timestamp; note = wr.note };
        withdrawalRequests.remove(withdrawalId); withdrawalRequests.add(withdrawalId, updatedWr);
        #ok(updatedWr);
      };
    };
  };

  public query func getAllPendingWithdrawals(adminUserId : Text) : async { #ok : [WithdrawalRequest]; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    #ok(withdrawalRequests.values().filter(func(wr) { switch (wr.status) { case (#pending) true; case (_) false } }).toArray());
  };

  public query func getMyWithdrawalRequests(userId : Text) : async { #ok : [WithdrawalRequest]; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) #ok(withdrawalRequests.values().filter(func(wr) { wr.userId == userId }).toArray());
    };
  };

  public shared func setMonthlyContributionAmount(adminUserId : Text, amount : Nat) : async { #ok : Nat; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    monthlyContributionTarget := amount;
    #ok(amount);
  };

  public query func getMonthlyContributionAmount() : async Nat {
    monthlyContributionTarget;
  };

  public shared func recordContribution(adminUserId : Text, userId : Text, month : Nat, year : Nat, amount : Nat) : async { #ok : MonthlyContribution; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) {
        let cid = generateContributionId();
        let c : MonthlyContribution = { id = cid; userId = userId; month = month; year = year; amount = amount; timestamp = Time.now() };
        monthlyContributions.add(cid, c);
        #ok(c);
      };
    };
  };

  public query func getContributionSummary(adminUserId : Text, month : Nat, year : Nat) : async { #ok : [MonthlyContribution]; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    #ok(monthlyContributions.values().filter(func(c) { c.month == month and c.year == year }).toArray());
  };

  public query func getMyContributions(userId : Text) : async { #ok : [MonthlyContribution]; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?_) #ok(monthlyContributions.values().filter(func(c) { c.userId == userId }).toArray());
    };
  };

  public query func getAllMembers(adminUserId : Text) : async { #ok : [MemberSummary]; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    let members = users.values().filter(func(u) { u.role == "member" }).map(func(u) {
      let loanCount = loans.values().toArray().filter(func(l) { l.userId == u.id }).size();
      { id = u.id; name = u.name; email = u.email; savings = u.savings; loanCount = loanCount };
    }).toArray();
    #ok(members);
  };

  public shared func addMember(adminUserId : Text, name : Text, email : Text, password : Text) : async { #ok : User; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserByEmail(email)) {
      case (?_) return #err("Email already registered");
      case null {};
    };
    let uid = generateUserId();
    let u : User = { id = uid; name = name; email = email; passwordHash = hashPassword(password); role = "member"; savings = 0; lastLogin = Time.now() };
    users.add(uid, u); emailToUserId.add(email, uid);
    #ok(u);
  };

  public shared func removeMember(adminUserId : Text, userId : Text) : async { #ok : Text; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        if (user.role == "admin") return #err("Cannot remove admin users");
        emailToUserId.remove(user.email); users.remove(userId);
        #ok("Member removed successfully");
      };
    };
  };

  public query func getMemberDetail(adminUserId : Text, userId : Text) : async { #ok : MemberDetail; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        let txs = transactions.values().toArray().filter(func(tx) { tx.userId == userId });
        let ls = loans.values().toArray().filter(func(l) { l.userId == userId });
        #ok({ user = user; transactions = txs; loans = ls });
      };
    };
  };

  public shared func approveLoan(adminUserId : Text, loanId : Text) : async { #ok : Loan; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (loans.get(loanId)) {
      case null return #err("Loan not found");
      case (?loan) {
        let updated : Loan = { id = loan.id; userId = loan.userId; amount = loan.amount; interest = loan.interest; status = #approved; timestamp = loan.timestamp };
        loans.remove(loanId); loans.add(loanId, updated); #ok(updated);
      };
    };
  };

  public shared func rejectLoan(adminUserId : Text, loanId : Text) : async { #ok : Loan; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (loans.get(loanId)) {
      case null return #err("Loan not found");
      case (?loan) {
        let updated : Loan = { id = loan.id; userId = loan.userId; amount = loan.amount; interest = loan.interest; status = #rejected; timestamp = loan.timestamp };
        loans.remove(loanId); loans.add(loanId, updated); #ok(updated);
      };
    };
  };

  public shared func markLoanPaid(adminUserId : Text, loanId : Text) : async { #ok : Loan; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (loans.get(loanId)) {
      case null return #err("Loan not found");
      case (?loan) {
        let updated : Loan = { id = loan.id; userId = loan.userId; amount = loan.amount; interest = loan.interest; status = #paid; timestamp = loan.timestamp };
        loans.remove(loanId); loans.add(loanId, updated); #ok(updated);
      };
    };
  };

  public shared func resetMember(adminUserId : Text, userId : Text) : async { #ok : Text; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = user.passwordHash; role = user.role; savings = 0; lastLogin = user.lastLogin };
        users.remove(userId); users.add(userId, updated);
        for ((lid, loan) in loans.entries()) {
          if (loan.userId == userId) {
            let ul : Loan = { id = loan.id; userId = loan.userId; amount = loan.amount; interest = loan.interest; status = #paid; timestamp = loan.timestamp };
            loans.remove(lid); loans.add(lid, ul);
          };
        };
        #ok("Member reset successfully");
      };
    };
  };

  public shared func resetMemberPassword(adminUserId : Text, memberId : Text, newPassword : Text) : async { #ok : Text; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    if (memberId == ADMIN_FIXED_ID) return #err("Cannot reset admin password this way");
    switch (getUserById(memberId)) {
      case null return #err("Member not found");
      case (?user) {
        let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = hashPassword(newPassword); role = user.role; savings = user.savings; lastLogin = user.lastLogin };
        users.remove(memberId); users.add(memberId, updated);
        #ok("Password reset successfully");
      };
    };
  };

  public shared func changePassword(userId : Text, currentPassword : Text, newPassword : Text) : async { #ok : Text; #err : Text } {
    switch (getUserById(userId)) {
      case null return #err("User not found");
      case (?user) {
        if (user.passwordHash != hashPassword(currentPassword)) return #err("Current password is incorrect");
        let updated : User = { id = user.id; name = user.name; email = user.email; passwordHash = hashPassword(newPassword); role = user.role; savings = user.savings; lastLogin = user.lastLogin };
        users.remove(userId); users.add(userId, updated);
        #ok("Password changed successfully");
      };
    };
  };


  public query func getTotalSavings(adminUserId : Text) : async { #ok : Nat; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    var total : Nat = 0;
    for (u in users.values()) { if (u.role == "member") { total += u.savings } };
    #ok(total);
  };

  public query func getAllPendingLoans(adminUserId : Text) : async { #ok : [Loan]; #err : Text } {
    if (not isAdminById(adminUserId)) return #err("Unauthorized");
    #ok(loans.values().filter(func(l) { switch (l.status) { case (#pending) true; case (_) false } }).toArray());
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    switch (getCallerUserId(caller)) {
      case null null;
      case (?uid) {
        switch (getUserById(uid)) {
          case null null;
          case (?u) ?{ id = u.id; name = u.name; email = u.email; role = u.role; savings = u.savings; lastLogin = u.lastLogin };
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdminCaller(caller)) { Runtime.trap("Unauthorized") };
    switch (principalToUserId.get(user)) {
      case null null;
      case (?uid) {
        switch (getUserById(uid)) {
          case null null;
          case (?u) ?{ id = u.id; name = u.name; email = u.email; role = u.role; savings = u.savings; lastLogin = u.lastLogin };
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isLoggedIn(caller)) Runtime.trap("Unauthorized");
    switch (getCallerUserId(caller)) {
      case null Runtime.trap("User not found");
      case (?uid) {
        switch (getUserById(uid)) {
          case null Runtime.trap("User not found");
          case (?u) {
            let updated : User = { id = u.id; name = profile.name; email = u.email; passwordHash = u.passwordHash; role = u.role; savings = u.savings; lastLogin = u.lastLogin };
            users.remove(uid); users.add(uid, updated);
          };
        };
      };
    };
  };
};
