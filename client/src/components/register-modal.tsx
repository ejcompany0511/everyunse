import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, User, Mail, Lock, UserPlus, Phone, Check, X } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    marketingConsent: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{ checking: boolean; available?: boolean; message?: string }>({
    checking: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Username duplicate check mutation
  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/auth/check-username", { username });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Only update if this is still the current username
      if (variables === formData.username) {
        setUsernameCheck({
          checking: false,
          available: data.available,
          message: data.message || (data.available ? "사용 가능한 아이디입니다" : "이미 사용 중인 아이디입니다")
        });
      }
    },
    onError: (error, variables) => {
      // Only update if this is still the current username
      if (variables === formData.username) {
        setUsernameCheck({
          checking: false,
          available: false,
          message: "아이디 확인 중 오류가 발생했습니다"
        });
      }
    }
  });

  const handleUsernameChange = (value: string) => {
    // Only allow English letters and numbers
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    setFormData(prev => ({ ...prev, username: filteredValue }));
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Reset check state immediately
    setUsernameCheck({ checking: false });
    
    if (filteredValue.length >= 3) {
      // Start checking indicator
      setUsernameCheck({ checking: true });
      
      // Debounce the API call by 500ms
      debounceTimeoutRef.current = setTimeout(() => {
        checkUsernameMutation.mutate(filteredValue);
      }, 500);
    } else if (filteredValue.length > 0) {
      setUsernameCheck({
        checking: false,
        available: false,
        message: "아이디는 3자 이상 입력해주세요"
      });
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone
      });
    },
    onSuccess: () => {
      toast({
        title: "회원가입 완료",
        description: "환영합니다! 로그인이 완료되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: ""
      });
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.username || !formData.email || !formData.password || !formData.name || !formData.phone) {
      toast({
        title: "입력 오류",
        description: "모든 필수 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "이메일 형식 오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(formData.phone.replace(/\s/g, ''))) {
      toast({
        title: "전화번호 형식 오류",
        description: "올바른 전화번호 형식을 입력해주세요. (010-1234-5678)",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            회원가입
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">이름</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="이름을 입력하세요"
                className="pl-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={registerMutation.isPending}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">아이디</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="아이디를 입력하세요"
                className={`pl-10 pr-10 rounded-lg border ${
                  usernameCheck.available === false 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : usernameCheck.available === true 
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                disabled={registerMutation.isPending}
              />
              {usernameCheck.checking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
              {!usernameCheck.checking && usernameCheck.available === true && (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              {!usernameCheck.checking && usernameCheck.available === false && (
                <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-xs mt-1 text-gray-500">
              영어와 숫자만 사용 가능 (3자 이상)
            </p>
            {usernameCheck.message && (
              <p className={`text-xs mt-1 ${
                usernameCheck.available === true ? 'text-green-600' : 'text-red-600'
              }`}>
                {usernameCheck.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">이메일</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="이메일을 입력하세요"
                className="pl-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={registerMutation.isPending}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="pl-10 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={registerMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={registerMutation.isPending}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">비밀번호 확인</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="pl-10 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={registerMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={registerMutation.isPending}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">전화번호 *</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="010-1234-5678"
                className="pl-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={registerMutation.isPending}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">SMS 알림을 위해 전화번호를 입력해주세요.</p>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <input
                id="marketingConsent"
                type="checkbox"
                checked={formData.marketingConsent}
                onChange={(e) => handleInputChange("marketingConsent", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={registerMutation.isPending}
              />
              <Label htmlFor="marketingConsent" className="text-sm text-gray-700 cursor-pointer">
                마케팅 정보 수신에 동의합니다 (선택)
              </Label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              이벤트, 프로모션, 새로운 서비스 소식을 SMS로 받아보실 수 있습니다.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "가입 중..." : "회원가입"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={registerMutation.isPending}
            >
              이미 계정이 있으신가요? 로그인하기
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}