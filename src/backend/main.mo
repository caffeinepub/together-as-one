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
  // Authorization logic
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserRole = {
    #admin;
    #member;
  };

  type User = {
    id : Text;
    name : Text;
    email : Text;
    passwordHash : Text;
    role : Text;
    savings : Nat;
    lastLogin : Int;
  };

  type Transaction = {
    id : Text;
    userId : Text;
    amount : Nat;
    timestamp : Int;
  };

  type LoanStatus = {
    #pending;
    #approved;
    #rejected;
    #paid;
  };

  type Loan = {
    id : Text;
    userId : Text;
    amount : Nat;
    interest : Nat;
    status : LoanStatus;
    timestamp : Int;
  };

  type MemberSummary = {
    id : Text;
    name : Text;
    email : Text;
    savings : Nat;
    loanCount : Nat;
  };

  type MemberDetail = {
    user : User;
    transactions : [Transaction];
    loans : [Loan];
  };

  type UserProfile = {
    id : Text;
    name : Text;
    email : Text;
    role : Text;
    savings : Nat;
    lastLogin : Int;
  };

  // Stable storage
  stable var stableUsers : [(Text, User)] = [];
  stable var stableEmailToUserId : [(Text, Text)] = [];
  stable var stablePrincipalToUserId : [(Principal, Text)] = [];
  stable var stableTransactions : [(Text, Transaction)] = [];
  stable var stableLoans : [(Text, Loan)] = [];
  stable var adminInitialized : Bool = false;
  stable var adminId : Text = "";
  stable var adminUser : User = { id = ""; name = ""; email = ""; passwordHash = ""; role = ""; savings = 0; lastLogin = 0 };

  let users = Map.empty<Text, User>();
  let emailToUserId = Map.empty<Text, Text>();
  let principalToUserId = Map.empty<Principal, Text>();
  let transactions = Map.empty<Text, Transaction>();
  let loans = Map.empty<Text, Loan>();

  stable var nextUserId : Nat = 1;
  stable var nextTransactionId : Nat = 1;
  stable var nextLoanId : Nat = 1;

  func hashPassword(password : Text) : Text {
    "hash_" # password;
  };

  func generateUserId() : Text {
    let id = nextUserId.toText();
    nextUserId += 1;
    id;
  };

  func generateTransactionId() : Text {
    let id = nextTransactionId.toText();
    nextTransactionId += 1;
    id;
  };

  func generateLoanId() : Text {
    let id = nextLoanId.toText();
    nextLoanId += 1;
    id;
  };

  func getUserByEmail(email : Text) : ?User {
    switch (emailToUserId.get(email)) {
      case null { null };
      case (?userId) { users.get(userId) };
    };
  };

  func getUserById(userId : Text) : ?User {
    users.get(userId);
  };

  func getCallerUserId(caller : Principal) : ?Text {
    principalToUserId.get(caller);
  };

  // Always use fixed ID "admin-0" to prevent ID drift across upgrades.
  // Uses remove+add to force correct state every time.
  func ensureAdminExists() {
    let adminEmail = "petermuchere@gmail.com";
    let fixedAdminId = "admin-0";

    // Preserve any existing savings
    let existingSavings : Nat = switch (users.get(fixedAdminId)) {
      case (?u) { u.savings };
      case null { 0 };
    };

    // Remove stale entries and re-add with correct data
    users.remove(fixedAdminId);
    emailToUserId.remove(adminEmail);

    let freshAdmin : User = {
      id = fixedAdminId;
      name = "Admin";
      email = adminEmail;
      passwordHash = hashPassword("admin123");
      role = "admin";
      savings = existingSavings;
      lastLogin = 0;
    };

    users.add(fixedAdminId, freshAdmin);
    emailToUserId.add(adminEmail, fixedAdminId);
  };

  system func preupgrade() {
    stableUsers := users.entries().toArray();
    stableEmailToUserId := emailToUserId.entries().toArray();
    stablePrincipalToUserId := principalToUserId.entries().toArray();
    stableTransactions := transactions.entries().toArray();
    stableLoans := loans.entries().toArray();
  };

  system func postupgrade() {
    // Restore all stable data first
    for ((k, v) in stableUsers.vals()) {
      users.remove(k);
      users.add(k, v);
    };
    for ((k, v) in stableEmailToUserId.vals()) {
      emailToUserId.remove(k);
      emailToUserId.add(k, v);
    };
    for ((k, v) in stablePrincipalToUserId.vals()) {
      principalToUserId.remove(k);
      principalToUserId.add(k, v);
    };
    for ((k, v) in stableTransactions.vals()) {
      transactions.remove(k);
      transactions.add(k, v);
    };
    for ((k, v) in stableLoans.vals()) {
      loans.remove(k);
      loans.add(k, v);
    };
    // Ensure admin always exists with correct credentials
    ensureAdminExists();
  };

  // On fresh install postupgrade may not run; call here too.
  // ensureAdminExists is idempotent (remove+add).
  ensureAdminExists();

  public shared func register(name : Text, email : Text, password : Text) : async { #ok : User; #err : Text } {
    switch (getUserByEmail(email)) {
      case (?_) { return #err("Email already registered") };
      case null {};
    };

    let userId = generateUserId();
    let newUser : User = {
      id = userId;
      name = name;
      email = email;
      passwordHash = hashPassword(password);
      role = "member";
      savings = 0;
      lastLogin = Time.now();
    };

    users.add(userId, newUser);
    emailToUserId.add(email, userId);

    #ok(newUser);
  };

  public shared ({ caller }) func login(email : Text, password : Text) : async { #ok : User; #err : Text } {
    switch (getUserByEmail(email)) {
      case null { return #err("User not found") };
      case (?user) {
        if (user.passwordHash != hashPassword(password)) {
          return #err("Invalid password");
        };

        let updatedUser = {
          id = user.id;
          name = user.name;
          email = user.email;
          passwordHash = user.passwordHash;
          role = user.role;
          savings = user.savings;
          lastLogin = Time.now();
        };

        users.remove(user.id);
        users.add(user.id, updatedUser);

        principalToUserId.remove(caller);
        principalToUserId.add(caller, user.id);

        let accessRole : AccessControl.UserRole = if (user.role == "admin") { #admin } else { #user };
        accessControlState.userRoles.remove(caller);
        accessControlState.userRoles.add(caller, accessRole);
        if (accessRole == #admin) {
          accessControlState.adminAssigned := true;
        };

        #ok(updatedUser);
      };
    };
  };

  public query ({ caller }) func getMyProfile(callerId : Text) : async { #ok : User; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    switch (getCallerUserId(caller)) {
      case null { return #err("User not found") };
      case (?userId) {
        if (userId != callerId) {
          return #err("Unauthorized: Can only view your own profile");
        };
        switch (getUserById(userId)) {
          case null { #err("User not found") };
          case (?user) { #ok(user) };
        };
      };
    };
  };

  public shared ({ caller }) func deposit(userId : Text, amount : Nat) : async { #ok : Nat; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    switch (getCallerUserId(caller)) {
      case null { return #err("User not found") };
      case (?callerUserId) {
        if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
          return #err("Unauthorized: Can only deposit to your own account");
        };

        switch (getUserById(userId)) {
          case null { return #err("User not found") };
          case (?user) {
            let newSavings = user.savings + amount;
            let updatedUser = {
              id = user.id;
              name = user.name;
              email = user.email;
              passwordHash = user.passwordHash;
              role = user.role;
              savings = newSavings;
              lastLogin = user.lastLogin;
            };
            users.remove(userId);
            users.add(userId, updatedUser);

            let txId = generateTransactionId();
            let transaction : Transaction = {
              id = txId;
              userId = userId;
              amount = amount;
              timestamp = Time.now();
            };
            transactions.add(txId, transaction);

            #ok(newSavings);
          };
        };
      };
    };
  };

  public query ({ caller }) func getMyTransactions(userId : Text) : async { #ok : [Transaction]; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    switch (getCallerUserId(caller)) {
      case null { return #err("User not found") };
      case (?callerUserId) {
        if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
          return #err("Unauthorized: Can only view your own transactions");
        };

        let userTransactions = transactions.values().filter(
          func(tx) { tx.userId == userId }
        );

        #ok(userTransactions.toArray());
      };
    };
  };

  public shared ({ caller }) func requestLoan(userId : Text, amount : Nat) : async { #ok : Loan; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    switch (getCallerUserId(caller)) {
      case null { return #err("User not found") };
      case (?callerUserId) {
        if (callerUserId != userId) {
          return #err("Unauthorized: Can only request loan for yourself");
        };

        let loanId = generateLoanId();
        let interest = (amount * 10) / 100;
        let loan : Loan = {
          id = loanId;
          userId = userId;
          amount = amount;
          interest = interest;
          status = #pending;
          timestamp = Time.now();
        };
        loans.add(loanId, loan);

        #ok(loan);
      };
    };
  };

  public query ({ caller }) func getMyLoans(userId : Text) : async { #ok : [Loan]; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };

    switch (getCallerUserId(caller)) {
      case null { return #err("User not found") };
      case (?callerUserId) {
        if (callerUserId != userId and not AccessControl.isAdmin(accessControlState, caller)) {
          return #err("Unauthorized: Can only view your own loans");
        };

        let userLoans = loans.values().filter(
          func(loan) { loan.userId == userId }
        );
        #ok(userLoans.toArray());
      };
    };
  };

  public query ({ caller }) func getAllMembers() : async { #ok : [MemberSummary]; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can view all members");
    };

    let members = users.values().filter(
      func(user) { user.role == "member" }
    ).map(
      func(user) {
        let loanCount = loans.values().toArray().filter(
          func(loan) { loan.userId == user.id }
        ).size();
        {
          id = user.id;
          name = user.name;
          email = user.email;
          savings = user.savings;
          loanCount = loanCount;
        };
      }
    ).toArray();

    #ok(members);
  };

  public shared ({ caller }) func addMember(name : Text, email : Text, password : Text) : async { #ok : User; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can add members");
    };

    switch (getUserByEmail(email)) {
      case (?_) { return #err("Email already registered") };
      case null {};
    };

    let userId = generateUserId();
    let newUser : User = {
      id = userId;
      name = name;
      email = email;
      passwordHash = hashPassword(password);
      role = "member";
      savings = 0;
      lastLogin = Time.now();
    };

    users.add(userId, newUser);
    emailToUserId.add(email, userId);

    #ok(newUser);
  };

  public shared ({ caller }) func removeMember(userId : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can remove members");
    };

    switch (getUserById(userId)) {
      case null { return #err("User not found") };
      case (?user) {
        if (user.role == "admin") {
          return #err("Cannot remove admin users");
        };
        emailToUserId.remove(user.email);
        users.remove(userId);
        #ok("Member removed successfully");
      };
    };
  };

  public query ({ caller }) func getMemberDetail(userId : Text) : async { #ok : MemberDetail; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can view member details");
    };

    switch (getUserById(userId)) {
      case null { return #err("User not found") };
      case (?user) {
        let userTransactions = transactions.values().toArray().filter(
          func(tx) { tx.userId == userId }
        );
        let userLoans = loans.values().toArray().filter(
          func(loan) { loan.userId == userId }
        );
        #ok({
          user = user;
          transactions = userTransactions;
          loans = userLoans;
        });
      };
    };
  };

  public shared ({ caller }) func approveLoan(loanId : Text) : async { #ok : Loan; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can approve loans");
    };

    switch (loans.get(loanId)) {
      case null { return #err("Loan not found") };
      case (?loan) {
        let updatedLoan = {
          id = loan.id;
          userId = loan.userId;
          amount = loan.amount;
          interest = loan.interest;
          status = #approved;
          timestamp = loan.timestamp;
        };
        loans.remove(loanId);
        loans.add(loanId, updatedLoan);
        #ok(updatedLoan);
      };
    };
  };

  public shared ({ caller }) func rejectLoan(loanId : Text) : async { #ok : Loan; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can reject loans");
    };

    switch (loans.get(loanId)) {
      case null { return #err("Loan not found") };
      case (?loan) {
        let updatedLoan = {
          id = loan.id;
          userId = loan.userId;
          amount = loan.amount;
          interest = loan.interest;
          status = #rejected;
          timestamp = loan.timestamp;
        };
        loans.remove(loanId);
        loans.add(loanId, updatedLoan);
        #ok(updatedLoan);
      };
    };
  };

  public shared ({ caller }) func markLoanPaid(loanId : Text) : async { #ok : Loan; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can mark loans as paid");
    };

    switch (loans.get(loanId)) {
      case null { return #err("Loan not found") };
      case (?loan) {
        let updatedLoan = {
          id = loan.id;
          userId = loan.userId;
          amount = loan.amount;
          interest = loan.interest;
          status = #paid;
          timestamp = loan.timestamp;
        };
        loans.remove(loanId);
        loans.add(loanId, updatedLoan);
        #ok(updatedLoan);
      };
    };
  };

  public shared ({ caller }) func resetMember(userId : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can reset members");
    };

    switch (getUserById(userId)) {
      case null { return #err("User not found") };
      case (?user) {
        let updatedUser = {
          id = user.id;
          name = user.name;
          email = user.email;
          passwordHash = user.passwordHash;
          role = user.role;
          savings = 0;
          lastLogin = user.lastLogin;
        };
        users.remove(userId);
        users.add(userId, updatedUser);

        for ((loanId, loan) in loans.entries()) {
          if (loan.userId == userId) {
            let updatedLoan = {
              id = loan.id;
              userId = loan.userId;
              amount = loan.amount;
              interest = loan.interest;
              status = #paid;
              timestamp = loan.timestamp;
            };
            loans.remove(loanId);
            loans.add(loanId, updatedLoan);
          };
        };

        #ok("Member reset successfully");
      };
    };
  };

  public query ({ caller }) func getTotalSavings() : async { #ok : Nat; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can view total savings");
    };

    var total : Nat = 0;
    for (user in users.values()) {
      if (user.role == "member") {
        total += user.savings;
      };
    };
    #ok(total);
  };

  public query ({ caller }) func getAllPendingLoans() : async { #ok : [Loan]; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can view pending loans");
    };

    let pendingLoans = loans.values().filter(
      func(loan) {
        switch (loan.status) {
          case (#pending) { true };
          case (_) { false };
        };
      }
    );
    #ok(pendingLoans.toArray());
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (getCallerUserId(caller)) {
      case null { null };
      case (?userId) {
        switch (getUserById(userId)) {
          case null { null };
          case (?user) {
            ?{
              id = user.id;
              name = user.name;
              email = user.email;
              role = user.role;
              savings = user.savings;
              lastLogin = user.lastLogin;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (principalToUserId.get(user)) {
      case null { null };
      case (?userId) {
        switch (getUserById(userId)) {
          case null { null };
          case (?userRecord) {
            ?{
              id = userRecord.id;
              name = userRecord.name;
              email = userRecord.email;
              role = userRecord.role;
              savings = userRecord.savings;
              lastLogin = userRecord.lastLogin;
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (getCallerUserId(caller)) {
      case null { Runtime.trap("User not found") };
      case (?userId) {
        switch (getUserById(userId)) {
          case null { Runtime.trap("User not found") };
          case (?user) {
            let updatedUser = {
              id = user.id;
              name = profile.name;
              email = user.email;
              passwordHash = user.passwordHash;
              role = user.role;
              savings = user.savings;
              lastLogin = user.lastLogin;
            };
            users.remove(userId);
            users.add(userId, updatedUser);
          };
        };
      };
    };
  };
};
